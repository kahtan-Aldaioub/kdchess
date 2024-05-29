import { useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <div className='h-screen-lg bg-slate-950'>
    
     <BrowserRouter>
     <Navbar/>
      <Routes>
        <Route path="/" element={<Landing />} /> 
        <Route path="/game" element={<Game />} /> 
      </Routes>
      <Footer/>
    </BrowserRouter>
    </div>
  )
}

export default App
