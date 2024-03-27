import { useSelector } from "react-redux";

const Home = () => {
  const { user } = useSelector((state) => state.users);
  return (
    <div>
      <p>Home</p>
      {user && <span>{user.name} </span>}
    </div>
  );
};

export default Home;
