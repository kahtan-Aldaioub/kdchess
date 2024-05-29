const Footer = () => {
  return (
    <footer className="bg-gray-800 p-4 mt-auto">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-gray-300">
          &copy; 2024 KDChess . All rights reserved.
        </div>
        <div className="flex space-x-4 ">
          <a href="#" className="text-gray-300 hover:text-white">Privacy Policy</a>
          <a href="#" className="text-gray-300 hover:text-white">Terms of Service</a>
          <a href="#" className="text-gray-300 hover:text-white">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
