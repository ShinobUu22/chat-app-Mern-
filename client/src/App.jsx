import Routes from "./Routes"
import axios from "axios"
import { UserContextProvider } from "./context/UserContext";


const App = () => {
  axios.defaults.baseURL = "https://chat-app-backend-i0bz.onrender.com"
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
     <Routes/>
    </UserContextProvider>
  )
}

export default App
