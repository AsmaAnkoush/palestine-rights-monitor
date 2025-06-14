import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Paper,
  Button
} from '@mui/material';

import {
  PieChart, Pie, Cell,
  LineChart, Line,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, XAxis, YAxis
} from 'recharts';

import Plot from 'react-plotly.js';

import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo';

import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_BASE_URL = 'http://localhost:8006';

const DUMMY_PALESTINE_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { "name": "West Bank" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [35.1, 31.8], [35.3, 31.9], [35.5, 31.7], [35.4, 31.5], [35.1, 31.8]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: { "name": "Gaza Strip" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.2, 31.2], [34.5, 31.3], [34.4, 31.0], [34.2, 31.2]
          ]
        ]
      }
    }
  ]
};

const FALLBACK_GEODATA_POINTS = [
  {
    location: {
      city: "Ramallah",
      region: "West Bank",
      coordinates: { type: "Point", coordinates: [35.2, 31.9] },
    },
    violation_type: "Arbitrary Detention",
  },
  {
    location: {
      city: "Gaza City",
      region: "Gaza Strip",
      coordinates: { type: "Point", coordinates: [34.46, 31.5] },
    },
    violation_type: "Extrajudicial Killing",
  },
  {
    location: {
      city: "Hebron",
      region: "West Bank",
      coordinates: { type: "Point", coordinates: [35.1, 31.5] },
    },
    violation_type: "Settler Violence",
  },
  {
    location: {
      city: "Khan Yunis",
      region: "Gaza Strip",
      coordinates: { type: "Point", coordinates: [34.3, 31.35] },
    },
    violation_type: "Demolition of Homes",
  },
];

const AnalyticsDashboardPage = () => {
  const [violationsData, setViolationsData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [geodata, setGeodata] = useState([]);
  const [dynamicViolationTypes, setDynamicViolationTypes] = useState([]);
  const [mapGeoJson, setMapGeoJson] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedYear, setSelectedYear] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [locationRegion, setLocationRegion] = useState('');
  const [selectedViolationType, setSelectedViolationType] = useState('');

  const dashboardRef = useRef(null);
  const mapSvgRef = useRef(null);

  const CHART_COLORS = [
    '#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722',
    '#795548', '#607D8B', '#CDDC39', '#FFEB3B', '#8BC34A', '#03A9F4', '#F44336',
    '#673AB7', '#009688'
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typesRes = await axios.get(`${API_BASE_URL}/cases/violation_types`);
      if (typesRes.data && Array.isArray(typesRes.data)) {
        setDynamicViolationTypes(typesRes.data);
      } else {
        console.warn("Violation types data is not an array:", typesRes.data);
        setDynamicViolationTypes([]);
      }

      const violationsRes = await axios.get(`${API_BASE_URL}/analytics/violations`, {
        params: { year: selectedYear, location_country: locationCountry, location_region: locationRegion },
      });
      setViolationsData(violationsRes.data);

      const timelineRes = await axios.get(`${API_BASE_URL}/analytics/timeline`, {
        params: { year: selectedYear, location_country: locationCountry, location_region: locationRegion, violation_type: selectedViolationType },
      });
      if (timelineRes.data && Array.isArray(timelineRes.data)) {
        setTimelineData(timelineRes.data);
      } else {
        console.warn("Timeline data is not an array:", timelineRes.data);
        setTimelineData([]);
      }

      const geodataRes = await axios.get(`${API_BASE_URL}/analytics/geodata`, {
        params: { year: selectedYear, violation_type: selectedViolationType },
      });
      if (geodataRes.data && Array.isArray(geodataRes.data) && geodataRes.data.length > 0) {
        setGeodata(geodataRes.data);
      } else {
        console.warn("Backend geodata is empty or not an array. Using fallback geodata for map display.");
        setGeodata(FALLBACK_GEODATA_POINTS);
      }

      if (!mapGeoJson) {
        setMapGeoJson(DUMMY_PALESTINE_GEOJSON);
      }

    } catch (err) {
      console.error("Error fetching analytics data:", err);
      let errorMessage = "Failed to fetch analytics data. Please try again later.";
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = `Error: ${err.response.data.detail}`;
      } else if (err.message) {
        errorMessage = `Network Error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, locationCountry, locationRegion, selectedViolationType, mapGeoJson]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!mapSvgRef.current || !mapGeoJson || geodata.length === 0) {
      return;
    }

    const svg = d3.select(mapSvgRef.current);
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;

    svg.selectAll("*").remove();

    const projection = geoMercator()
      .fitSize([width, height], mapGeoJson)
      .precision(0.1);

    const pathGenerator = geoPath().projection(projection);

    svg.selectAll("path")
      .data(mapGeoJson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#E0E0E0")
      .attr("stroke", "#BDBDBD")
      .attr("stroke-width", 0.5);

    svg.selectAll("circle")
      .data(geodata)
      .enter()
      .append("circle")
      .attr("cx", d => {
        if (d.location?.coordinates?.coordinates && d.location.coordinates.coordinates.length === 2) {
          return projection([d.location.coordinates.coordinates[0], d.location.coordinates.coordinates[1]])[0];
        }
        return 0;
      })
      .attr("cy", d => {
        if (d.location?.coordinates?.coordinates && d.location.coordinates.coordinates.length === 2) {
          return projection([d.location.coordinates.coordinates[0], d.location.coordinates.coordinates[1]])[1];
        }
        return 0;
      })
      .attr("r", 5)
      .attr("fill", "red")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .append("title")
      .text(d => `Violation: ${d.violation_type}\nLocation: ${d.location?.city || 'N/A'}, ${d.location?.region || 'N/A'}`);

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        svg.selectAll('path').attr('transform', event.transform);
        svg.selectAll('circle').attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [mapGeoJson, geodata]);

  const handleResetFilters = () => {
    setSelectedYear('');
    setLocationCountry('');
    setLocationRegion('');
    setSelectedViolationType('');
  };

  const renderCustomizedPieLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 > 5) {
      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize="12px"
          fontWeight="bold"
        >
          {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
      );
    }
    return null;
  }, []);

  const generatePdfReport = () => {
    if (dashboardRef.current) {
      const element = dashboardRef.current;
      html2pdf().from(element).save('Analytics_Dashboard_Report.pdf');
    } else {
      console.error("Dashboard ref is not available for PDF generation.");
    }
  };

  const generateExcelReport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      const violationsSheet = XLSX.utils.json_to_sheet(violationsData);
      XLSX.utils.book_append_sheet(workbook, violationsSheet, "Violations by Type");

      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timelineSheet, "Cases Over Time");

      const geodataSheet = XLSX.utils.json_to_sheet(geodata);
      XLSX.utils.book_append_sheet(workbook, geodataSheet, "Geographical Data");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(data, 'Analytics_Data_Report.xlsx');
    } catch (e) {
      console.error("Error generating Excel report:", e);
    }
  };

  const plotlyBarData = [{
    x: violationsData.map(d => d.violation_type),
    y: violationsData.map(d => d.count),
    type: 'bar',
    marker: { color: CHART_COLORS[0] },
    name: 'Count'
  }];

  const plotlyBarLayout = {
    xaxis: {
      title: 'Violation Type',
      tickangle: -45,
      automargin: true
    },
    yaxis: {
      title: 'Count'
    },
    margin: {
      b: 150,
      t: 50,
      l: 60,
      r: 30
    },
    responsive: true,
    height: 500,
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, bgcolor: '#fffbe6' }} ref={dashboardRef}>
      <Typography variant="h4" component="h1" align="center"
        sx={{ mb: 5, fontWeight: 'fontWeightBold', color: '#e65100' }}>
        Analytics Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 4, boxShadow: 2, borderRadius: 1 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          onClick={generatePdfReport}
          sx={{
            backgroundColor: '#d84315',
            '&:hover': { backgroundColor: '#bf360c' },
            color: '#fff'
          }}
          startIcon={<i className="fa-solid fa-file-pdf"></i>}
        >
          Generate PDF Report
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={generateExcelReport}
          startIcon={<i className="fa-solid fa-file-excel"></i>}
        >
          Generate Excel Report
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} color="primary" />
          <Typography variant="h6" sx={{ mt: 3, color: '#555' }}>Loading analytics data...</Typography>
        </Box>
      ) : (
        <>
          <Grid container justifyContent="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12}>
              <Paper elevation={6} sx={{ p: 4, borderRadius: 3, bgcolor: '#F5F8FA' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'fontWeightMedium', color: '#e65100' }}>
                  Apply Filters
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Year"
                      type="text" // Changed to text to allow for pattern validation before conversion
                      value={selectedYear}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,4}$/.test(value)) { // Allows up to 4 digits
                          setSelectedYear(value);
                        }
                      }}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                      inputProps={{
                        maxLength: 4, // Ensures no more than 4 characters can be typed
                        pattern: "\\d{4}", // HTML5 pattern for exactly 4 digits
                        title: "Please enter a 4-digit year" // Tooltip for the pattern
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Country"
                      value={locationCountry}
                      onChange={(e) => setLocationCountry(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Region"
                      value={locationRegion}
                      onChange={(e) => setLocationRegion(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel id="violation-type-label">Violation Type</InputLabel>
                      <Select
                        labelId="violation-type-label"
                        value={selectedViolationType}
                        label="Violation Type"
                        onChange={(e) => setSelectedViolationType(e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value=""><em>All Types</em></MenuItem>
                        {dynamicViolationTypes.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleResetFilters}
                      sx={{
                        height: '40px',
                        borderRadius: 1,
                        backgroundColor: '#f57c00',
                        '&:hover': { backgroundColor: '#ef6c00' },
                        color: '#fff'
                      }}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Grid container justifyContent="center" spacing={3} sx={{ mb: 4 }}>

            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={6} sx={{ p: 3, height: '600px', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'fontWeightBold', color: '#e65100' }}>Violations by Type (Plotly.js)</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  {violationsData.length > 0 ? (
                    <Plot
                      data={plotlyBarData}
                      layout={plotlyBarLayout}
                      useResizeHandler={true}
                      style={{ width: '100%', height: '100%' }}
                      config={{ displayModeBar: false }}
                    />
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                      No data available to display the bar chart for violations by type.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={6} sx={{ p: 3, height: '600px', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'fontWeightBold', color: '#e65100' }}>Cases/Reports Over Time (Recharts)</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #B0BEC5', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#333' }}
                        itemStyle={{ color: '#555' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                      <Line type="monotone" dataKey="count" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8, strokeWidth: 2, fill: CHART_COLORS[1] }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={6} sx={{ p: 3, height: '600px', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'fontWeightBold', color: '#e65100' }}>Violations Distribution (Recharts)</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {violationsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={violationsData}
                          dataKey="count"
                          nameKey="violation_type"
                          cx="50%"
                          cy="50%"
                          outerRadius={180}
                          fill="#8884d8"
                          labelLine={false}
                          label={renderCustomizedPieLabel}
                        >
                          {violationsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #B0BEC5', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                          labelStyle={{ color: '#333' }}
                          itemStyle={{ color: '#555' }}
                        />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                      No data available to display the pie chart for violations distribution.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid container justifyContent="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12}>
              <Paper elevation={6} sx={{ p: 3, height: '550px', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'fontWeightBold', color: '#e65100' }}>Geographical Overview (D3.js)</Typography>
                <Box sx={{
                  flexGrow: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: '#F0F8F0',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  {mapGeoJson && geodata && geodata.length > 0 ? (
                    <svg ref={mapSvgRef} style={{ width: '100%', height: '100%' }}></svg>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                      No geographical data or map boundaries available to display the map.
                      <br /> Please ensure your backend is returning `geodata` with valid location and coordinates,
                      or that `FALLBACK_GEODATA_POINTS` are defined correctly for testing.
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Total geodata points: <Box component="span" sx={{ fontWeight: 'bold' }}>{geodata.length}</Box>
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default AnalyticsDashboardPage;