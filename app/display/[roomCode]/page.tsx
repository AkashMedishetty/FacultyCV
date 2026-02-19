import { DisplayContainer } from "@/components/display/DisplayContainer";

export default function DisplayPage({
  params,
}: {
  params: { roomCode: string };
}) {
  return <DisplayContainer roomCode={params.roomCode} />;
}
