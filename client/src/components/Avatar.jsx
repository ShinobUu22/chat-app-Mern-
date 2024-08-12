import PropTypes from "prop-types";

const Avatar = ({ username, userId, online }) => {
    const colors = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-cyan-500', 'bg-aqua-500']

    const userIDs = parseInt(userId, 16)
      console.log(username)

  return (
    <div className={`relative text-white h-8 w-8 rounded-3xl ${colors[userIDs%colors.length]}  flex items-center justify-center`}>
     <div className="text-center w-full">{username ? username[0] : 'U'}</div>

      {online && (
        
      <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border border-white shadow-lg shadow-black"></div>
    )}
    {!online && (
        
        <div className="absolute w-3 h-3 bg-gray-400 bottom-0 right-0 rounded-full border border-white shadow-lg shadow-black"></div>
      )}
    </div>
  );
};

export default Avatar;

Avatar.propTypes = { username: PropTypes.string, userId: PropTypes.string, online:PropTypes.bool };
