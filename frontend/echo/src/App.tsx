import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { FeedPage } from './features/feed/FeedPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { ChatPage } from './features/chat/ChatPage';
import { AuthInit } from './components/AuthInit';

export const App = () => {
    return (
        <BrowserRouter>
            <AuthInit>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/" element={<FeedPage />} />
                            <Route path="/profile/:username" element={<ProfilePage />} />
                            <Route path="/chat" element={<ChatPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthInit>
        </BrowserRouter>
    );
};

export default App;