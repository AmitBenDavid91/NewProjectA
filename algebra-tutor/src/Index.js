// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import AlgebraTutorAdmin from './AlgebraTutorAdmin';

document.addEventListener('DOMContentLoaded', function() {
    const rootElement = document.getElementById('algebra-tutor-admin-root');

    if (rootElement) {
        ReactDOM.render(
            <React.StrictMode>
                <AlgebraTutorAdmin />
            </React.StrictMode>,
            rootElement
        );
    }
});