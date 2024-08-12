import Routes from "./Routes"
import axios from "axios"
import { UserContextProvider } from "./context/UserContext";


const App = () => {
  axios.defaults.baseURL = "http://localhost:5000"
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
     <Routes/>
    </UserContextProvider>
  )
}

export default App
