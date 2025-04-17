// SmileyIcon.js
import { createIcon } from "@chakra-ui/react";

const SmileyIcon = createIcon({
  displayName: "SmileyIcon",
  viewBox: "0 0 512 512",
  path: (
    <path
      fill="currentColor"
      d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 48c110.3 0 200 89.7 200 200s-89.7 200-200 200S56 366.3 56 256 145.7 56 256 56zm-80 112c-13.3 0-24 10.7-24 24s10.7 24 24 24 24-10.7 24-24-10.7-24-24-24zm160 0c-13.3 0-24 10.7-24 24s10.7 24 24 24 24-10.7 24-24-10.7-24-24-24zm-80 200c41.8 0 77.7-26.9 90.5-64h-181c12.8 37.1 48.7 64 90.5 64z"
    />
  ),
});

export default SmileyIcon;
