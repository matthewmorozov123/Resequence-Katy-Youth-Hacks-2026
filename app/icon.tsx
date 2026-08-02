import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "64px",
        height: "64px",
        overflow: "hidden",
        borderRadius: "14px",
        background: "#f5f1e8",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "15px",
          width: "34px",
          height: "7px",
          borderRadius: "9px",
          background: "#10233f",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "20px",
          top: "29px",
          width: "36px",
          height: "7px",
          borderRadius: "9px",
          background: "#9ec318",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "43px",
          width: "40px",
          height: "7px",
          borderRadius: "9px",
          background: "#10233f",
        }}
      />
    </div>,
    size,
  );
}
