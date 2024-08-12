import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";

export default function RegisterAndLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedOrReg, setLoggedOrReg] = useState("register");
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = loggedOrReg === "register" ? "/register" : "/login";

    try {
      const { data } = await axios.post(url, { username, password }, { withCredentials: true });
      setLoggedInUsername(username);
      setId(data.id);
    } catch (error) {
      if (error.response) {
        console.error("Error:", error.response.data.error);
      } else {
        console.error("Network Error:", error.message);
      }
    }
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-68 mx-auto mb-12" onSubmit={handleSubmit}>
        <input
          value={username}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          value={password}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white block w-full rounded-lg p-2">
          {loggedOrReg === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-2">
          {loggedOrReg === "register" && (
            <div className="">
              Already have an Account?
              <button
                className="hover:text-blue-600"
                onClick={() => setLoggedOrReg("login")}
              >
                Login Here
              </button>
            </div>
          )}
          {loggedOrReg === "login" && (
            <div className="">
              {`Don't have an Account?`}
              <button
                className="hover:text-blue-600"
                onClick={() => setLoggedOrReg("register")}
              >
                Register Here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
