import React from 'react';
import Navbar from './Components/Navbar';   // تأكد من أن المسار صحيح
import Hero from './Components/Hero';       // تأكد من أن المسار صحيح
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Hero />
    </div>
  );
}

export default App;
