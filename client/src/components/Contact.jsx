import Avatar from './Avatar'
import PropTypes from 'prop-types'

const Contact = ({id,onClick,selected,username,online}) => {
  console.log(username)
  return (
    <div
  
    onClick={() => onClick(id)}
    className={`border-t border-b border-slate-400 py-4 flex items-center gap-2 font-semibold text-xl pl-4 ${
      selected && 'bg-blue-200'
    } cursor-pointer`}
  >
    <Avatar username={username} userId={id} online={online}/>
    <span>{username}</span>
  </div>
  )
}

export default Contact


Contact.propTypes = { username: PropTypes.string, id: PropTypes.string, selected: PropTypes.bool, onClick: PropTypes.func, online: PropTypes.bool};