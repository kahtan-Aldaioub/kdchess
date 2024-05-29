const NavBar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-bold">KDChess </div>
        <div className="flex space-x-4">
          <a href="/" className="text-gray-300 hover:text-white">Home</a>
          <a href="/game" className="text-gray-300 hover:text-white">Play</a>
          <a href="#" className="text-gray-300 hover:text-white">Tournaments</a>
          <a href="#" className="text-gray-300 hover:text-white">Profile</a>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
