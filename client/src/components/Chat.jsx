import { useContext, useEffect, useState, useRef } from "react";
import Contact from "./Contact";
import ChatApp from "./ChatApp";
import { UserContext } from "../context/UserContext";
import { IoSendOutline } from "react-icons/io5";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { IoMdPerson } from "react-icons/io";
import { RiAttachment2 } from "react-icons/ri";

const Chat = () => {
  const [wsConn, setWsConn] = useState(null);
  const [onPeeps, setOnPeeps] = useState({});
  const [offPeeps, setOffPeeps] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [msgTxt, setMsgTxt] = useState("");
  const [msgs, setMsgs] = useState([]);

  const ref = useRef();
  const { username, setId, setUsername, id } = useContext(UserContext);

  useEffect(() => {
    connWs();
  }, []);

  function connWs() {
    const ws = new WebSocket("ws://chat-app-mern-1-94jg.onrender.com");

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setWsConn(ws);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      setTimeout(() => {
        console.log("Trying to reconnect");
        connWs();
      }, 1000);
    };

    ws.addEventListener("message", handleMsg);
  }

  function showOnline(peepsArr) {
    const peeps = {};
    peepsArr.forEach(({ userId, username }) => {
      if (userId && userId !== id) peeps[userId] = username; // Filter out yourself
    });
    setOnPeeps(peeps);
  }

  function handleMsg(e) {
    const msgData = JSON.parse(e.data);
    console.log("Received message:", msgData);

    if ("online" in msgData) {
      showOnline(msgData.online);
    } else if ("text" in msgData) {
      setMsgs((prev) => {
        if (!prev.some((msg) => msg.id === msgData.id)) {
          return [...prev, { ...msgData }];
        }
        return prev;
      });
    }
  }

  function sendMessage(e, file = null) {
    if (e) e.preventDefault();

    if (wsConn && selectedUser && (msgTxt.trim() || file)) {
      const message = {
        id: uuidv4(),
        receiver: selectedUser,
        text: msgTxt,
        sender: id,
        file,
      };
      console.log("Sending message:", message);
      wsConn.send(JSON.stringify(message));
      setMsgTxt("");
      setMsgs((prev) => [...prev, message]);
    }
  }

  function sendFile(e) {
    const file = e.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        const base64Data = result.split(",")[1];
        const fileData = {
          name: file.name,
          data: base64Data,
        };
        sendMessage(null, fileData);
      };
    }
  }

  useEffect(() => {
    const div = ref.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [msgs]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offPeepsArr = res.data
        .filter((p) => p._id !== id) // Filter out yourself
        .filter((p) => !Object.keys(onPeeps).includes(p._id));
      const offPeepss = {};
      offPeepsArr.forEach((p) => {
        offPeepss[p._id] = p;
      });
      setOffPeeps(offPeepss);
    });
  }, [id, onPeeps]);

  useEffect(() => {
    if (selectedUser) {
      axios
        .get(`messages/${selectedUser}`)
        .then((res) => {
          setMsgs(res.data);
        })
        .catch((err) => {
          console.error("Error fetching messages:", err);
        });
    }
  }, [selectedUser]);

  const excludeYou = { ...onPeeps };
  delete excludeYou[id];

  function logoutfxn() {
    axios.post(`/logout`).then(() => {
      setId(null);
      setUsername(null);
    });
  }

  return (
    <div className="flex h-screen">
      <div className="bg-purple-50 w-1/3 flex flex-col">
        <div className="flex-grow">
          <ChatApp />
          {Object.keys(excludeYou).map(
            (p) =>
              onPeeps[p] && (
                <div className="" key={p}>
                  <Contact
                    id={p}
                    username={onPeeps[p]}
                    onClick={() => setSelectedUser(p)}
                    selected={p === selectedUser}
                    online={true}
                  />
                </div>
              )
          )}

          {Object.keys(offPeeps).map(
            (p) =>
              offPeeps[p] && (
                <div className="" key={p}>
                  <Contact
                    id={p}
                    username={offPeeps[p].username}
                    onClick={() => setSelectedUser(p)}
                    selected={p === selectedUser}
                    online={false}
                  />
                </div>
              )
          )}
        </div>
        <div className="p-2 text-center flex flex-col bg-fuchsia-200 gap-3">
          <span className="text-xl flex items-center justify-center gap-2">
            <IoMdPerson size={24} /> {username}
          </span>
          <button
            className="text-sm text-slate-600 bg-sky-300 px-2 py-1 border rounded-lg "
            onClick={logoutfxn}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-blue-100 w-2/3 flex flex-col ">
        {!!selectedUser && (
          <div className=" h-full relative">
            <div className="w-full h-6"></div>
            <div className="px-3 overflow-y-scroll absolute tpo-0 left-0 right-0 bottom-2 h-full">
              <div className="w-full h-12 border"></div>
              {msgs.map((msg) => (
                <div className="flex" key={msg.id}>
                  {msg.sender === id && (
                    <div className="flex-grow bg-inherit"></div>
                  )}
                  <div
                    className={`flex p-2 my-2 rounded-3xl mt-3 ${
                      msg.sender === id
                        ? "bg-blue-500 text-white text-right justify-end "
                        : "bg-slate-400 text-white"
                    }`}
                  >
                    {msg.text}
                    {msg.file && (
                      <div className="flex items-center gap-2 ">
                        <a
                          target="_blank"
                          href={`${axios.defaults.baseURL}/uploads/${msg.file}`}
                          download
                          className="border-b flex"
                        >
                          <RiAttachment2 size={15} />
                          {msg.file.name}
                        </a>
                      </div>
                    )}
                    {msg.sender === id && (
                      <div className="flex-grow bg-inherit"></div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={ref}></div>
            </div>
          </div>
        )}
        {!selectedUser ? (
          <div className="flex h-full items-center justify-center text-4xl text-slate-500">
            Select a person and start chatting!
          </div>
        ) : (
          <form
            className="relative w-full h-24 flex flex-col justify-center items-center py-3 bg-inherit"
            onSubmit={sendMessage}
          >
            <div className="absolute bottom-4 flex w-5/6 h-14 rounded-3xl py-1 px-2 bg-white">
              <input
                type="text"
                value={msgTxt}
                onChange={(e) => setMsgTxt(e.target.value)}
                className="bg-inherit p-2 flex-grow outline-none"
                placeholder="Write your messages here..."
              />
              <label className="bg-slate-300 rounded-3xl text-center p-2 text-white right-1 mr-2 border border-slate-400 cursor-pointer">
                <input type="file" className="hidden" onChange={sendFile} />
                <RiAttachment2 />
              </label>
              <button
                type="submit"
                className="bg-sky-500 rounded-3xl text-center p-2 text-white right-1"
              >
                <IoSendOutline size={20} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
