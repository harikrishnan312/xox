import React from 'react';
import { Route, Routes } from 'react-router-dom'
import Home from '../components/pages/home/Home';
import Xox from '../components/pages/xox/Xox';

export default function XoxRoutes() {
    return (
        <Routes>
            <Route element={<Home />} path={"/"}></Route>
            <Route element={<Xox />} path={"/board"}></Route>
        </Routes>
    )
}
