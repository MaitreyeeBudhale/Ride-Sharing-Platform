export const createMarker = (color, size = 16) => {
  const el = document.createElement("div");

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundColor = color;
  el.style.border = "3px solid white";
  el.style.borderRadius = "50%";
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";

  return el;
};
export const createCurrentLocationMarker = () => {
  const el = document.createElement("div");

  el.style.width = "18px";
  el.style.height = "18px";
  el.style.backgroundColor = "#4285F4";
  el.style.border = "3px solid white";
  el.style.borderRadius = "50%";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";

  return el;
};
