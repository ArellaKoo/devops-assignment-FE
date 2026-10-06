import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function HomePage() {
  return (
    <main className="container py-5">
      <h1>SkipQ</h1>
      <p>Order from local stalls and collect your food when it is ready.</p>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="container py-5">
      <h1>Page not found</h1>
      <Link to="/">Return to SkipQ</Link>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
