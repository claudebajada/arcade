import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Gallery from './Gallery';
import FishForFruit from './games/FishForFruit';
import NumberNomad from './games/NumberNomad';
import EmbassyOfOddballs from './games/EmbassyOfOddballs';

/*
  ============================================================
  HOW TO ADD A NEW GAME:
  ============================================================
  1. Create your game component in src/games/YourGame.jsx
  2. Import it at the top of this file
  3. Add a <Route> below pointing to your component
  4. Add an entry to the GAMES array in Gallery.jsx
  5. Rebuild the Docker image: docker compose up --build
  ============================================================
*/

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/fish-for-fruit" element={<FishForFruit />} />
      <Route path="/number-nomad" element={<NumberNomad />} />
      <Route path="/embassy-of-oddballs" element={<EmbassyOfOddballs />} />
      {/* Add new game routes here */}
    </Routes>
  );
}
