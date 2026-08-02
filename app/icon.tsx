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
        borderRadius: "16px",
        background: "#10233f",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "15px",
          top: "11px",
          width: "7px",
          height: "42px",
          borderRadius: "7px",
          background: "#fffdf8",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "20px",
          top: "11px",
          width: "29px",
          height: "25px",
          border: "7px solid #fffdf8",
          borderLeft: "0",
          borderRadius: "0 15px 15px 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "33px",
          top: "31px",
          width: "7px",
          height: "34px",
          borderRadius: "7px",
          background: "#c7ed34",
          transform: "rotate(-40deg)",
          transformOrigin: "top center",
        }}
      />
    </div>,
    size,
  );
}
