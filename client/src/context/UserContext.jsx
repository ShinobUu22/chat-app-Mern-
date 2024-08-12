import axios from "axios";
import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);

  // Check if the user is authenticated on page load
  useEffect(() => {
    axios
      .get("/profile", { withCredentials: true })
      .then((response) => {
        console.log(response.data);
        if (response.data.username) {
          setUsername(response.data.username);
          setId(response.data.id);
        }
      })
      .catch((error) => {
        console.error("Error fetching profile:", error.message);
        if (error.response && error.response.status === 401) {
          console.log("Unauthorized: Redirecting to login");
        }
      });
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </UserContext.Provider>
  );
}

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
