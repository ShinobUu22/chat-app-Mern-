import Routes from "./Routes";
import axios from "axios";
import { UserContextProvider } from "./context/UserContext";

const App = () => {
  axios.defaults.baseURL = "https://chat-app-mern-1-94jg.onrender.com";
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
};

export default App;
