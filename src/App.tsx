import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { MainPage } from "./Pages";
import { RoomPage } from "./Pages/room";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/room/:id",
    element: <RoomPage />,
  },
]);
function App() {
  return <RouterProvider router={router} />;
}

export default App;
