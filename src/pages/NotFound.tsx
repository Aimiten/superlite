import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <img src="public/404%20kuva.png" alt="404 Error Image" className="mb-4" />
        <p className="text-xl text-gray-600 mb-4">Pahoittelut, sivua ei löytynyt...</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Takaisin etusivulle
        </a>
      </div>
    </div>
  );
};

export default NotFound;