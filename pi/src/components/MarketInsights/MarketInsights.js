import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Tabs,
    Tab,
    Box,
    Chip,
    Divider,
    Rating
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot
} from '@mui/lab';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import Cookies from 'js-cookie';
import './MarketInsights.css';

// Couleurs pour le pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const MarketInsights = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [insights, setInsights] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedInsight, setSelectedInsight] = useState(null);
    const [chartType, setChartType] = useState('pie');

    // Create axios instance with default config
    const axiosInstance = axios.create({
        baseURL: 'https://ikramsegni.fr/api',
        withCredentials: true
    });

    // Add request interceptor to add token to every request
    axiosInstance.interceptors.request.use((config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Load history on component mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await axiosInstance.get('/market-insights/history');
            if (response.data.success) {
                setHistory(response.data.data);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            setError('Failed to load market insights history');
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError(null);
        setInsights(null);

        try {
            const response = await axiosInstance.get(
                `/market-insights/search/${encodeURIComponent(searchTerm)}`
            );

            if (response.data.success) {
                setInsights(response.data.data);
                await loadHistory(); // Reload history after new search
            } else {
                setError('Failed to get market insights');
            }
        } catch (error) {
            console.error('Error fetching market insights:', error);
            setError('Error fetching market insights. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const searchPopularPlatforms = async () => {
        const platforms = ["javascript", "python", "java", "react", "web development", "data science"];
        setLoading(true);
        setError(null);
        
        try {
            // Recherche de façon aléatoire un des sujets populaires
            const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
            setSearchTerm(randomPlatform);
            
            const response = await axiosInstance.get(
                `/market-insights/search/${encodeURIComponent(randomPlatform)}`
            );

            if (response.data.success) {
                setInsights(response.data.data);
                await loadHistory();
            } else {
                setError('Impossible de récupérer les données du marché');
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setError('Erreur lors de la recherche. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const renderPriceChart = (analysis) => {
        if (!analysis || !analysis.average_price) return null;

        const data = Object.entries(analysis.average_price).map(([platform, price]) => ({
            platform,
            price: parseFloat(price.toFixed(2))
        }));

        return (
            <Box sx={{ height: 300, width: '100%', mt: 2 }}>
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="platform" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="price" fill="#8884d8" name="Average Price" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        );
    };

    const renderPlatformDistributionChart = (platformDistribution) => {
        if (!platformDistribution || Object.keys(platformDistribution).length === 0) {
            return null;
        }

        const data = Object.entries(platformDistribution).map(([platform, count]) => ({
            platform,
            count
        }));

        return (
            <Box sx={{ height: 300, width: '100%', mt: 2 }}>
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="platform" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3f51b5" name="Nombre de cours" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        );
    };

    const renderPlatformPieChart = (platformDistribution) => {
        if (!platformDistribution || Object.keys(platformDistribution).length === 0) {
            return null;
        }

        const data = Object.entries(platformDistribution).map(([platform, count]) => ({
            name: platform,
            value: count
        }));

        return (
            <Box sx={{ height: 300, width: '100%', mt: 2 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} cours`, name]} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        );
    };

    const renderAnalysis = (analysis) => {
        if (!analysis) return null;

        // Check if we have necessary data
        if (!analysis.platform_distribution) {
            return (
                <Typography color="error">
                    Le format des données est incorrect. Impossible d'afficher l'analyse.
                </Typography>
            );
        }

        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Tableau de bord des statistiques
                    </Typography>
                </Grid>

                {/* Statistics Cards */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="textSecondary">
                                Nombre de cours
                            </Typography>
                            <Typography variant="h4">
                                {analysis.total_courses}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="textSecondary">
                                Plateformes
                            </Typography>
                            <Typography variant="h4">
                                {Object.keys(analysis.platform_distribution).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="textSecondary">
                                Prix moyen
                            </Typography>
                            <Typography variant="h4">
                                {analysis.average_price}€
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="textSecondary">
                                Note moyenne
                            </Typography>
                            <Typography variant="h4">
                                {analysis.average_rating}/5
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Platform Distribution Chart */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Distribution des plateformes
                            </Typography>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs value={chartType} onChange={(e, newValue) => setChartType(newValue)} aria-label="chart type">
                                    <Tab label="Pie Chart" value="pie" />
                                    <Tab label="Bar Chart" value="bar" />
                                </Tabs>
                            </Box>
                            {chartType === 'pie' ? 
                                renderPlatformPieChart(analysis.platform_distribution) : 
                                renderPlatformDistributionChart(analysis.platform_distribution)
                            }
                        </CardContent>
                    </Card>
                </Grid>

                {/* Course List */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Cours trouvés
                            </Typography>
                            {analysis.courses && analysis.courses.length > 0 ? (
                                <Grid container spacing={2}>
                                    {analysis.courses.map((course, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="subtitle1" gutterBottom>
                                                        {course.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                                        {course.platform}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        {course.rating ? (
                                                            <>
                                                                <Rating value={course.rating} precision={0.1} readOnly size="small" />
                                                                <Typography variant="body2" sx={{ ml: 1 }}>
                                                                    ({course.rating})
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" color="textSecondary">
                                                                Note non disponible
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Typography variant="body2" gutterBottom>
                                                        {course.price ? `${course.price}€` : 'Gratuit'}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        href={course.url}
                                                        target="_blank"
                                                        sx={{ mt: 1 }}
                                                    >
                                                        Voir le cours
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Typography>Aucun cours trouvé</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderHistory = () => {
        if (history.length === 0) {
            return (
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Aucun historique d'analyse de marché disponible.
                </Typography>
            );
        }

        return (
            <Timeline>
                {history.map((item, index) => (
                    <TimelineItem key={index}>
                        <TimelineSeparator>
                            <TimelineDot />
                            {index < history.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6">
                                        {item.searchTerm}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {formatDate(item.timestamp)}
                                    </Typography>
                                    <Typography variant="body2">
                                        Cours analysés: {item.totalCourses || 0}
                                    </Typography>
                                    <Typography variant="body2">
                                        Plateformes: {item.platforms ? Object.keys(item.platforms).join(', ') : 'Aucune'}
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={async () => {
                                            try {
                                                const response = await axiosInstance.get(
                                                    `/market-insights/detail/${item.searchTerm}/${
                                                        item.timestamp.replace(/:/g, '_').replace(/\./g, '_')
                                                    }`
                                                );
                                                if (response.data.success) {
                                                    setSelectedInsight(response.data.data);
                                                }
                                            } catch (error) {
                                                console.error('Error loading insight details:', error);
                                                setError('Impossible de charger les détails de cette analyse');
                                            }
                                        }}
                                        sx={{ mt: 1 }}
                                    >
                                        Voir les détails
                                    </Button>
                                </CardContent>
                            </Card>
                        </TimelineContent>
                    </TimelineItem>
                ))}
            </Timeline>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Market Insights
                </Typography>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            label="Rechercher des informations sur le marché"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ex: python programming"
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSearch}
                            disabled={loading || !searchTerm.trim()}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Rechercher'}
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="secondary"
                            onClick={searchPopularPlatforms}
                            disabled={loading}
                        >
                            Suggérer
                        </Button>
                    </Grid>
                </Grid>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Résultats" />
                    <Tab label="Historique" />
                </Tabs>

                <Divider sx={{ mb: 2 }} />

                {activeTab === 0 ? (
                    insights ? (
                        renderAnalysis(insights)
                    ) : (
                        <Typography variant="body1">
                            Recherchez des informations sur le marché pour voir l'analyse.
                        </Typography>
                    )
                ) : (
                    renderHistory()
                )}

                {selectedInsight && (
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Analyse détaillée pour "{selectedInsight.searchTerm}"
                            </Typography>
                            {renderAnalysis(selectedInsight)}
                            <Button
                                sx={{ mt: 2 }}
                                onClick={() => setSelectedInsight(null)}
                            >
                                Fermer les détails
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </Paper>
        </Container>
    );
};

export default MarketInsights; 