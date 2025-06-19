import { useQuery } from "@tanstack/react-query";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const fetchCalls = async () => {
  const userString = localStorage.getItem("user");
  if (!userString) throw new Error("No user found in localStorage.");

  const user = JSON.parse(userString);
  const user_id = user?.email;
  if (!user_id) throw new Error("User email not found in user object.");

  const res = await fetch(
    `${SERVER_URL}/api/calls?user_id=${encodeURIComponent(user_id)}`
  );
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data))
    throw new Error("Invalid data format received from server.");

  console.log("calls", data);
  return data;
};

export const useRealCallData = () => {
  return useQuery({
    queryKey: ["calls"],
    queryFn: fetchCalls,
  });
};
