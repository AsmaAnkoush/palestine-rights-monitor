import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// استيراد مكونات Material-UI لتحسين الواجهة وتصميمها
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

// استيراد مكونات Recharts للمخططات الخطية والدائرية (تعتمد داخلياً على D3.js)
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, XAxis, YAxis
} from 'recharts';

// استيراد Plotly لمخطط الأعمدة التفاعلي
import Plot from 'react-plotly.js';

// استيراد D3.js لإنشاء الخريطة (d3-geo للإسقاطات)
import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo'; // استيراد محدد لوظائف الخريطة

// ======================================================================================
// !! حلاً لمشكلة "Module not found": المكتبات غير مثبتة في بيئة مشروعك !!
// ======================================================================================
// إذا كنت تستمر في رؤية أخطاء مثل:
// - ERROR: Could not resolve "html2pdf.js"
// - ERROR: Could not resolve "xlsx"
// - ERROR: Could not resolve "file-saver"
// - ERROR: Could not resolve "d3"
// - ERROR: Could not resolve "react-plotly.js"
//
// فهذا يعني أن هذه المكتبات غير مثبتة في بيئة Node.js الخاصة بمشروعك،
// أو أن مترجم JavaScript (bundler) لا يستطيع العثور عليها.
// الكود نفسه سليم، ولكن يجب تثبيت هذه المكتبات لتتمكن من استخدامها.
//
// لحل هذه المشكلة بشكل قاطع، يرجى اتباع هذه الخطوات بدقة:
// 1. افتح الطرفية (Terminal) أو موجه الأوامر (Command Prompt) على جهاز الكمبيوتر الخاص بك.
// 2. انتقل إلى المجلد الرئيسي لمشروع React الخاص بك (المجلد الذي يحتوي على ملف package.json).
//    مثال: cd C:\Users\user\palestine_rights_monitorr\frontend
// 3. قم بتشغيل الأمر التالي لمرة واحدة فقط لتثبيت جميع المكتبات الضرورية:
//
//    إذا كنت تستخدم npm (الموصى به عادةً لمشاريع React):
//    npm install html2pdf.js xlsx file-saver d3 react-plotly.js plotly.js
//
//    إذا كنت تستخدم yarn (بديل لـ npm):
//    yarn add html2pdf.js xlsx file-saver d3 react-plotly.js plotly.js
//
// 4. انتظر حتى يكتمل التثبيت بنجاح. قد يستغرق الأمر بضع لحظات.
// 5. بعد اكتمال التثبيت، يرجى **إعادة تشغيل خادم التطوير** الخاص بك.
//    (عادةً عن طريق إيقاف تشغيله باستخدام Ctrl+C ثم تشغيله مرة أخرى باستخدام npm start أو yarn start)
//
// هذه الخطوات ستسمح لمشروعك بالعثور على المكتبات واستيرادها بشكل صحيح،
// وستختفي أخطاء "Module not found".
// ======================================================================================

// استيراد مكتبات توليد التقارير
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// الرابط الأساسي للواجهة الخلفية (تأكد من صحة هذا المسار)
const API_BASE_URL = 'http://localhost:8006';

// بيانات GeoJSON وهمية مبسطة لفلسطين لأغراض العرض التوضيحي
// في تطبيق حقيقي، ستقوم بتحميل هذا من ملف خارجي (مثلاً: /data/palestine_adm1.geojson)
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

// بيانات جغرافية وهمية إضافية لضمان ظهور نقاط على الخريطة حتى لو كان backend لا يرسل بيانات
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
  // أضف المزيد من النقاط حسب الحاجة
];


const AnalyticsDashboardPage = () => {
  // =====================================================================
  // 1. حالات البيانات (States for Data)
  // =====================================================================
  const [violationsData, setViolationsData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [geodata, setGeodata] = useState([]); // سيتم تحديثها بالبيانات الحقيقية أو التجريبية
  const [dynamicViolationTypes, setDynamicViolationTypes] = useState([]);
  const [mapGeoJson, setMapGeoJson] = useState(null); // حالة جديدة لبيانات GeoJSON للخريطة

  // =====================================================================
  // 2. حالات التحميل والخطأ (Loading and Error States)
  // =====================================================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================================
  // 3. حالات الفلاتر (Filter States)
  // =====================================================================
  const [selectedYear, setSelectedYear] = useState(''); // New state for year filter
  const [locationCountry, setLocationCountry] = useState('');
  const [locationRegion, setLocationRegion] = useState('');
  const [selectedViolationType, setSelectedViolationType] = useState('');

  // =====================================================================
  // 4. المراجع (Refs) - لتحديد عناصر DOM معينة للتعامل معها (مثل تصدير PDF)
  // =====================================================================
  const dashboardRef = useRef(null); // مرجع لعنصر لوحة التحكم الرئيسية لغرض تصدير PDF
  const mapSvgRef = useRef(null);    // مرجع لعنصر SVG الخاص بالخريطة

  // =====================================================================
  // 5. الثوابت (Constants)
  // =====================================================================
  const CHART_COLORS = [
    '#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722',
    '#795548', '#607D8B', '#CDDC39', '#FFEB3B', '#8BC34A', '#03A9F4', '#F44336',
    '#673AB7', '#009688'
  ];

  // =====================================================================
  // 6. وظيفة جلب البيانات (Data Fetching Function)
  // =====================================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // جلب بيانات أنواع الانتهاكات الديناميكية
      const typesRes = await axios.get(`${API_BASE_URL}/cases/violation_types`);
      if (typesRes.data && Array.isArray(typesRes.data)) {
        setDynamicViolationTypes(typesRes.data);
      } else {
        console.warn("Violation types data is not an array:", typesRes.data);
        setDynamicViolationTypes([]);
      }

      // جلب بيانات الانتهاكات حسب النوع
      const violationsRes = await axios.get(`${API_BASE_URL}/analytics/violations`, {
        params: { year: selectedYear, location_country: locationCountry, location_region: locationRegion },
      });
      setViolationsData(violationsRes.data);

      // جلب بيانات الحالات/التقارير بمرور الوقت
      // Note: The backend should ideally provide timeline data aggregated by year if 'month' etc. is removed.
      const timelineRes = await axios.get(`${API_BASE_URL}/analytics/timeline`, {
        params: { year: selectedYear, location_country: locationCountry, location_region: locationRegion, violation_type: selectedViolationType },
      });
      if (timelineRes.data && Array.isArray(timelineRes.data)) {
        setTimelineData(timelineRes.data);
      } else {
        console.warn("Timeline data is not an array:", timelineRes.data);
        setTimelineData([]);
      }

      // جلب بيانات الموقع الجغرافي
      const geodataRes = await axios.get(`${API_BASE_URL}/analytics/geodata`, {
        params: { year: selectedYear, violation_type: selectedViolationType },
      });
      // استخدام بيانات geodata من الـ backend، وإذا كانت فارغة، استخدم بيانات تجريبية
      if (geodataRes.data && Array.isArray(geodataRes.data) && geodataRes.data.length > 0) {
        setGeodata(geodataRes.data);
      } else {
        console.warn("Backend geodata is empty or not an array. Using fallback geodata for map display.");
        setGeodata(FALLBACK_GEODATA_POINTS); // استخدام البيانات التجريبية هنا
      }

      // تحميل بيانات GeoJSON للخريطة (إذا لم تكن قد حملت بعد)
      // في تطبيق حقيقي، ستقوم بتحميل ملف GeoJSON من مسار عام
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
  }, [selectedYear, locationCountry, locationRegion, selectedViolationType, mapGeoJson]); // Updated dependencies

  // =====================================================================
  // 7. تأثيرات جانبية (useEffect Hooks)
  // =====================================================================
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // useEffect لإنشاء خريطة D3.js
  useEffect(() => {
    // يجب أن تكون بيانات geodata موجودة قبل محاولة رسم النقاط
    if (!mapSvgRef.current || !mapGeoJson || geodata.length === 0) {
      return; // لا ترسم الخريطة إذا لم يكن هناك مرجع SVG أو بيانات
    }

    const svg = d3.select(mapSvgRef.current);
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;

    // مسح أي عناصر سابقة في SVG
    svg.selectAll("*").remove();

    // تعريف الإسقاط (Projection)
    const projection = geoMercator()
      .fitSize([width, height], mapGeoJson) // جعل الخريطة تتناسب مع حجم الـ SVG
      .precision(0.1);

    // تعريف مولد المسارات (Path generator)
    const pathGenerator = geoPath().projection(projection);

    // رسم حدود المناطق الجغرافية
    svg.selectAll("path")
      .data(mapGeoJson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#E0E0E0") // لون المنطقة الرمادي الفاتح
      .attr("stroke", "#BDBDBD") // لون الحدود
      .attr("stroke-width", 0.5);

    // رسم نقاط البيانات (geodata)
    svg.selectAll("circle")
      .data(geodata)
      .enter()
      .append("circle")
      .attr("cx", d => {
        // تحقق من وجود 'location' و 'coordinates' و 'coordinates' كـ Array
        if (d.location?.coordinates?.coordinates && d.location.coordinates.coordinates.length === 2) {
          return projection([d.location.coordinates.coordinates[0], d.location.coordinates.coordinates[1]])[0];
        }
        return 0; // قيمة افتراضية آمنة
      })
      .attr("cy", d => {
        // تحقق من وجود 'location' و 'coordinates' و 'coordinates' كـ Array
        if (d.location?.coordinates?.coordinates && d.location.coordinates.coordinates.length === 2) {
          return projection([d.location.coordinates.coordinates[0], d.location.coordinates.coordinates[1]])[1];
        }
        return 0; // قيمة افتراضية آمنة
      })
      .attr("r", 5) // نصف قطر الدائرة
      .attr("fill", "red") // لون الدائرة (نقاط الانتهاك)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .append("title") // إضافة تلميح الأدوات (Tooltip)
      // تحقق من وجود d.location.city و d.location.region أو استخدم 'N/A' كقيمة افتراضية
      .text(d => `Violation: ${d.violation_type}\nLocation: ${d.location?.city || 'N/A'}, ${d.location?.region || 'N/A'}`);

    // إضافة وظيفة التكبير/التصغير (Zoom & Pan)
    const zoom = d3.zoom()
      .scaleExtent([1, 8]) // نطاق التكبير
      .on('zoom', (event) => {
        svg.selectAll('path').attr('transform', event.transform);
        svg.selectAll('circle').attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [mapGeoJson, geodata]); // تعتمد الخريطة على بيانات GeoJSON و geodata


  // =====================================================================
  // 8. وظائف المساعدة (Helper Functions)
  // =====================================================================

  // دالة لإعادة تعيين جميع الفلاتر إلى قيمها الافتراضية
  const handleResetFilters = () => {
    setSelectedYear(''); // Reset year filter
    setLocationCountry('');
    setLocationRegion('');
    setSelectedViolationType('');
  };

  // دالة مخصصة لتسمية المخطط الدائري (Recharts)
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

  // =====================================================================
  // 9. وظائف توليد التقارير (Report Generation Functions)
  // =====================================================================

  // توليد تقرير PDF من محتوى لوحة التحكم المرئي
  const generatePdfReport = () => {
    if (dashboardRef.current) {
      const element = dashboardRef.current;
      html2pdf().from(element).save('Analytics_Dashboard_Report.pdf');
    } else {
      console.error("Dashboard ref is not available for PDF generation.");
    }
  };

  // توليد تقرير Excel من البيانات الأولية
  const generateExcelReport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // ورقة بيانات الانتهاكات حسب النوع
      const violationsSheet = XLSX.utils.json_to_sheet(violationsData);
      XLSX.utils.book_append_sheet(workbook, violationsSheet, "Violations by Type");

      // ورقة بيانات الحالات/التقارير بمرور الوقت
      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timelineSheet, "Cases Over Time");

      // ورقة بيانات الموقع الجغرافي
      const geodataSheet = XLSX.utils.json_to_sheet(geodata);
      XLSX.utils.book_append_sheet(workbook, geodataSheet, "Geographical Data");

      // كتابة وحفظ الملف
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(data, 'Analytics_Data_Report.xlsx');
    } catch (e) {
      console.error("Error generating Excel report:", e);
    }
  };


  // =====================================================================
  // 10. إعدادات Plotly (Plotly Configurations)
  // =====================================================================
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

  // =====================================================================
  // 11. مكون الواجهة الرسومية (Component UI Structure)
  // =====================================================================
  return (
<Container maxWidth="xl" sx={{ mt: 4, mb: 4, bgcolor: '#fffbe6' }} ref={dashboardRef}>
      {/* عنوان لوحة التحكم */}
      <Typography variant="h4" component="h1" align="center"
        sx={{ mb: 5, fontWeight: 'fontWeightBold', color: '#e65100' }}>
        Analytics Dashboard
      </Typography>

      {/* عرض رسالة الخطأ إذا كانت موجودة */}
      {error && <Alert severity="error" sx={{ mb: 4, boxShadow: 2, borderRadius: 1 }}>{error}</Alert>}

      {/* أزرار توليد التقارير */}
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
          startIcon={<i className="fa-solid fa-file-excel"></i>} // مثال على أيقونة
        >
          Generate Excel Report
        </Button>
      </Box>


      {/* عرض مؤشر التحميل أثناء جلب البيانات */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} color="primary" />
          <Typography variant="h6" sx={{ mt: 3, color: '#555' }}>Loading analytics data...</Typography>
        </Box>
      ) : (
        <>
          {/* قسم الفلاتر (يبقى بعرض كامل) */}
          <Grid container justifyContent="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12}>
              <Paper elevation={6} sx={{ p: 4, borderRadius: 3, bgcolor: '#F5F8FA' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'fontWeightMedium', color: '#e65100' }}>
                  Apply Filters
                </Typography>
                <Grid container spacing={3}>
                  {/* New Year Filter */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Year"
                      type="number" // Changed to number for year input
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                      inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }} // Optional: set min/max year
                    />
                  </Grid>
                  {/* Removed Start Date and End Date */}
                  {/* Removed Time Unit */}
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

          {/* قسم المخططات الثلاثة في نفس السطر (على الشاشات الكبيرة والمتوسطة) */}
          <Grid container justifyContent="center" spacing={3} sx={{ mb: 4 }}>

            {/* مخطط الانتهاكات حسب النوع - تم التنفيذ باستخدام Plotly.js */}
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

            {/* مخطط الحالات/التقارير بمرور الوقت - تم التنفيذ باستخدام Recharts (المعتمد على D3.js) */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={6} sx={{ p: 3, height: '600px', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'fontWeightBold', color: '#e65100' }}>Cases/Reports Over Time (Recharts)</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      {/* Assuming 'date' in timelineData will now represent years or aggregated periods */}
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

            {/* مخطط دائري لتوزيع الانتهاكات - تم التنفيذ باستخدام Recharts (المعتمد على D3.js) */}
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

          {/* نظرة عامة جغرافية - تم التنفيذ باستخدام D3.js */}
          <Grid container justifyContent="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12}>
              <Paper elevation={6} sx={{ p: 3, height: '550px', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'fontWeightBold', color: '#e65100' }}>Geographical Overview (D3.js)</Typography>
                <Box sx={{
                  flexGrow: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: '#F0F8F0', // خلفية فاتحة للخريطة
                  borderRadius: 2,
                  overflow: 'hidden' // لإخفاء أي جزء من SVG يخرج عن الحدود
                }}>
                  {/*
                    شرط العرض: يجب أن يكون mapGeoJson موجودًا (حدود الخريطة)،
                    ويجب أن تكون هناك نقاط بيانات geodata (سواء من backend أو تجريبية)
                  */}
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
                {/* عرض عدد نقاط البيانات الجغرافية أسفل الخريطة */}
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