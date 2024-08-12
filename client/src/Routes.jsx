import { useContext } from "react";
import RegisterAndLogin from "./components/Register";
import { UserContext } from "./context/UserContext";
import Chat from "./components/Chat";

const Routes = () => {
  const { username } = useContext(UserContext);

  if (username) {
    return <Chat/> // Display user information or redirect
  }

  return (<RegisterAndLogin />)
};

export default Routes;
