// pages/GuestDashboard.jsx

import { Link } from "react-router-dom";

export default function GuestDashboard() {
    return (
        <div className="guest-dashboard">
            <h1>Study Assistant</h1>

            <p>
                Browse notes, public Q&A, and resources without an account.
            </p>

            <div className="buttons">
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
            </div>

            <div>
                <Link to="/subjects">Browse Subjects</Link>
                <Link to="/resource-packs">Resource Packs</Link>
                <Link to="/qna/discover">Public Q&A</Link>
            </div>
        </div>
    );
}