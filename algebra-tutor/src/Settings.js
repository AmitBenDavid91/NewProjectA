// src/components/Settings/Settings.js
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import './Settings.css';

const Settings = () => {
    const { addNotification } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        general: {
            practicePageTitle: 'Algebra Practice',
            practicePageDescription: 'Practice your algebra skills with interactive exercises.',
            questionsPerPage: 5,
            allowGuestAccess: true
        },
        display: {
            primaryColor: '#0073aa',
            secondaryColor: '#23282d',
            showCategoryMenu: true,
            showDifficultySelector: true,
            responsiveDesign: true
        },
        math: {
            useMathJax: true,
            mathJaxVersion: '3.2.2',
            mathJaxCDN: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
            useMathLive: true,
            mathLiveVersion: '0.90.5'
        },
        advanced: {
            debugMode: false,
            clearDataOnUninstall: false,
            customCSS: ''
        }
    });

    // Fetch settings on component mount
    useEffect(() => {
        fetchSettings();
    }, []);

    // Fetch settings from the server
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_settings&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                setSettings(data.data.settings);
            } else {
                throw new Error(data.data.message || 'Failed to fetch settings');
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Handle checkbox changes
    const handleCheckboxChange = (section, field) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: !prev[section][field]
            }
        }));
    };

    // Save settings
    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(algebraTutorData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'algebra_tutor_save_settings',
                    nonce: algebraTutorData.nonce,
                    settings: JSON.stringify(settings)
                })
            });

            const data = await response.json();

            if (data.success) {
                addNotification('Settings saved successfully.', 'success');
            } else {
                throw new Error(data.data.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-indicator">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <h1>Algebra Tutor Settings</h1>

            <div className="settings-container">
                <div className="settings-tabs">
                    <div className="nav-tab-wrapper">
                        <a href="#general" className="nav-tab nav-tab-active">General</a>
                        <a href="#display" className="nav-tab">Display</a>
                        <a href="#math" className="nav-tab">Math Options</a>
                        <a href="#advanced" className="nav-tab">Advanced</a>
                    </div>
                </div>

                <div className="settings-content">
                    {/* General Settings */}
                    <div id="general" className="settings-section active">
                        <h2>General Settings</h2>
                        <p>Configure basic plugin behavior and user experience options.</p>

                        <table className="form-table">
                            <tbody>
                            <tr>
                                <th scope="row"><label htmlFor="practicePageTitle">Practice Page Title</label></th>
                                <td>
                                    <input
                                        type="text"
                                        id="practicePageTitle"
                                        value={settings.general.practicePageTitle}
                                        onChange={(e) => handleInputChange('general', 'practicePageTitle', e.target.value)}
                                    />
                                    <p className="description">The title displayed on the practice page.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="practicePageDescription">Practice Page Description</label></th>
                                <td>
                    <textarea
                        id="practicePageDescription"
                        value={settings.general.practicePageDescription}
                        onChange={(e) => handleInputChange('general', 'practicePageDescription', e.target.value)}
                    ></textarea>
                                    <p className="description">Short description displayed on the practice page.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="questionsPerPage">Questions Per Page</label></th>
                                <td>
                                    <input
                                        type="number"
                                        id="questionsPerPage"
                                        value={settings.general.questionsPerPage}
                                        onChange={(e) => handleInputChange('general', 'questionsPerPage', parseInt(e.target.value, 10))}
                                        min="1"
                                        max="50"
                                    />
                                    <p className="description">Number of questions to display per page (1-50).</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">Guest Access</th>
                                <td>
                                    <label htmlFor="allowGuestAccess">
                                        <input
                                            type="checkbox"
                                            id="allowGuestAccess"
                                            checked={settings.general.allowGuestAccess}
                                            onChange={() => handleCheckboxChange('general', 'allowGuestAccess')}
                                        />
                                        Allow guest access to practice questions
                                    </label>
                                    <p className="description">If enabled, non-logged-in users can access the practice page.</p>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Display Settings */}
                    <div id="display" className="settings-section">
                        <h2>Display Settings</h2>
                        <p>Customize how the plugin appears on your website.</p>

                        <table className="form-table">
                            <tbody>
                            <tr>
                                <th scope="row"><label htmlFor="primaryColor">Primary Color</label></th>
                                <td>
                                    <input
                                        type="color"
                                        id="primaryColor"
                                        value={settings.display.primaryColor}
                                        onChange={(e) => handleInputChange('display', 'primaryColor', e.target.value)}
                                    />
                                    <p className="description">Main color used throughout the plugin.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="secondaryColor">Secondary Color</label></th>
                                <td>
                                    <input
                                        type="color"
                                        id="secondaryColor"
                                        value={settings.display.secondaryColor}
                                        onChange={(e) => handleInputChange('display', 'secondaryColor', e.target.value)}
                                    />
                                    <p className="description">Secondary color used for accents and highlights.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">Navigation Options</th>
                                <td>
                                    <label htmlFor="showCategoryMenu">
                                        <input
                                            type="checkbox"
                                            id="showCategoryMenu"
                                            checked={settings.display.showCategoryMenu}
                                            onChange={() => handleCheckboxChange('display', 'showCategoryMenu')}
                                        />
                                        Show category menu
                                    </label>
                                    <br />
                                    <label htmlFor="showDifficultySelector">
                                        <input
                                            type="checkbox"
                                            id="showDifficultySelector"
                                            checked={settings.display.showDifficultySelector}
                                            onChange={() => handleCheckboxChange('display', 'showDifficultySelector')}
                                        />
                                        Show difficulty selector
                                    </label>
                                    <p className="description">Choose which navigation elements to display.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">Responsive Design</th>
                                <td>
                                    <label htmlFor="responsiveDesign">
                                        <input
                                            type="checkbox"
                                            id="responsiveDesign"
                                            checked={settings.display.responsiveDesign}
                                            onChange={() => handleCheckboxChange('display', 'responsiveDesign')}
                                        />
                                        Enable responsive design
                                    </label>
                                    <p className="description">Optimize display for mobile and tablet devices.</p>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Math Options */}
                    <div id="math" className="settings-section">
                        <h2>Math Options</h2>
                        <p>Configure the mathematical rendering libraries.</p>

                        <table className="form-table">
                            <tbody>
                            <tr>
                                <th scope="row">MathJax</th>
                                <td>
                                    <label htmlFor="useMathJax">
                                        <input
                                            type="checkbox"
                                            id="useMathJax"
                                            checked={settings.math.useMathJax}
                                            onChange={() => handleCheckboxChange('math', 'useMathJax')}
                                        />
                                        Use MathJax for formula rendering
                                    </label>
                                    <p className="description">Use MathJax to render mathematical formulas (recommended).</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="mathJaxVersion">MathJax Version</label></th>
                                <td>
                                    <select
                                        id="mathJaxVersion"
                                        value={settings.math.mathJaxVersion}
                                        onChange={(e) => handleInputChange('math', 'mathJaxVersion', e.target.value)}
                                        disabled={!settings.math.useMathJax}
                                    >
                                        <option value="3.2.2">3.2.2 (Latest)</option>
                                        <option value="3.2.1">3.2.1</option>
                                        <option value="3.2.0">3.2.0</option>
                                        <option value="3.1.4">3.1.4</option>
                                        <option value="3.1.3">3.1.3</option>
                                    </select>
                                    <p className="description">Select the MathJax version to use.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="mathJaxCDN">MathJax CDN URL</label></th>
                                <td>
                                    <input
                                        type="text"
                                        id="mathJaxCDN"
                                        value={settings.math.mathJaxCDN}
                                        onChange={(e) => handleInputChange('math', 'mathJaxCDN', e.target.value)}
                                        disabled={!settings.math.useMathJax}
                                    />
                                    <p className="description">URL to load MathJax from. Default is jsdelivr CDN.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">MathLive</th>
                                <td>
                                    <label htmlFor="useMathLive">
                                        <input
                                            type="checkbox"
                                            id="useMathLive"
                                            checked={settings.math.useMathLive}
                                            onChange={() => handleCheckboxChange('math', 'useMathLive')}
                                        />
                                        Use MathLive for WYSIWYG formula editing
                                    </label>
                                    <p className="description">Enable MathLive for visual formula editing in the admin area.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="mathLiveVersion">MathLive Version</label></th>
                                <td>
                                    <select
                                        id="mathLiveVersion"
                                        value={settings.math.mathLiveVersion}
                                        onChange={(e) => handleInputChange('math', 'mathLiveVersion', e.target.value)}
                                        disabled={!settings.math.useMathLive}
                                    >
                                        <option value="0.90.5">0.90.5 (Latest)</option>
                                        <option value="0.90.4">0.90.4</option>
                                        <option value="0.90.3">0.90.3</option>
                                        <option value="0.90.2">0.90.2</option>
                                    </select>
                                    <p className="description">Select the MathLive version to use.</p>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Advanced Settings */}
                    <div id="advanced" className="settings-section">
                        <h2>Advanced Settings</h2>
                        <p>Configure advanced options for the plugin.</p>

                        <table className="form-table">
                            <tbody>
                            <tr>
                                <th scope="row">Debug Mode</th>
                                <td>
                                    <label htmlFor="debugMode">
                                        <input
                                            type="checkbox"
                                            id="debugMode"
                                            checked={settings.advanced.debugMode}
                                            onChange={() => handleCheckboxChange('advanced', 'debugMode')}
                                        />
                                        Enable debug mode
                                    </label>
                                    <p className="description">Output additional debugging information (not recommended for production).</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">Data Cleanup</th>
                                <td>
                                    <label htmlFor="clearDataOnUninstall">
                                        <input
                                            type="checkbox"
                                            id="clearDataOnUninstall"
                                            checked={settings.advanced.clearDataOnUninstall}
                                            onChange={() => handleCheckboxChange('advanced', 'clearDataOnUninstall')}
                                        />
                                        Clear all data on uninstall
                                    </label>
                                    <p className="description">When the plugin is uninstalled, remove all data and settings from the database.</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><label htmlFor="customCSS">Custom CSS</label></th>
                                <td>
                    <textarea
                        id="customCSS"
                        value={settings.advanced.customCSS}
                        onChange={(e) => handleInputChange('advanced', 'customCSS', e.target.value)}
                        rows="10"
                    ></textarea>
                                    <p className="description">Add custom CSS to style the plugin. This will be added to both the admin and frontend.</p>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="settings-actions">
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={saveSettings}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;