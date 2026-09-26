import { useTheme } from "../hooks/theme";
import { Switch } from "@headlessui/react";

function ThemeSwitch() {
  const { isDark, setTheme } = useTheme();

  const handleChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <Switch
      checked={isDark}
      onChange={handleChange}
      className="group relative flex h-full w-10 cursor-pointer rounded-full bg-accent dark:bg-accent p-0.5 ease-in-out focus:not-data-focus:outline-none data-checked:bg-primary data-focus:outline data-focus:outline-white"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out group-data-checked:translate-x-4"
      />
    </Switch>
  );
}
export default ThemeSwitch;
