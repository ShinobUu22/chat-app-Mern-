import { IoIosChatbubbles } from "react-icons/io";

const ChatApp = () => {
  return (
    <div className="w-full flex flex-col items-center gap-4 py-4 mb-4">
      <div className="text-3xl text-center font-thin bg-blue-600 p-4 rounded-full text-white mb-4 flex items-center gap-2">
      <IoIosChatbubbles />
        Chat App
      </div>
     
    </div>
  );
};

export default ChatApp;
