/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();

  const create = async (e: any) => {
    e.preventDefault();
    const resp = await fetch("http://localhost:5003/create");
    const { room_id } = await resp.json();
    navigate(`/room/${room_id}`);
  };

  return <Button onClick={create}>Create Room</Button>;
};

export { CreateRoom };
