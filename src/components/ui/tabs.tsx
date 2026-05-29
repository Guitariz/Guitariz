import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  activeValue: string;
  prevValue: string;
  indicatorClassName?: string;
  layoutId: string;
  registerValue: (value: string) => void;
  tabOrder: React.MutableRefObject<string[]>;
};

const TabsContext = React.createContext<TabsContextValue>({
  activeValue: "",
  prevValue: "",
  layoutId: "",
  registerValue: () => {},
  tabOrder: { current: [] },
});

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  indicatorClassName?: string;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ value, defaultValue, onValueChange, indicatorClassName, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [prevValue, setPrevValue] = React.useState("");
  const tabOrder = React.useRef<string[]>([]);
  const id = React.useId();

  const activeValue = value !== undefined ? value : internalValue;

  const registerValue = React.useCallback((val: string) => {
    if (!tabOrder.current.includes(val)) {
      tabOrder.current = [...tabOrder.current, val];
    }
  }, []);

  const handleValueChange = (newValue: string) => {
    setPrevValue(activeValue);
    if (value === undefined) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeValue, prevValue, indicatorClassName, layoutId: id, registerValue, tabOrder }}>
      <TabsPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, value, children, ...props }, ref) => {
  const { activeValue, indicatorClassName, layoutId, registerValue } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  React.useEffect(() => {
    if (value) registerValue(value);
  }, [value, registerValue]);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={`tab-pill-${layoutId}`}
          className={cn(
            "absolute inset-0 rounded-sm",
            indicatorClassName ?? "bg-background shadow-sm",
          )}
          transition={{ type: "spring", duration: 0.2, bounce: 0 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, value, children, ...props }, ref) => {
  const { prevValue, tabOrder } = React.useContext(TabsContext);

  const direction = React.useMemo(() => {
    const order = tabOrder.current;
    const prevIdx = order.indexOf(prevValue);
    const currIdx = order.indexOf(value ?? "");
    if (prevIdx === -1 || currIdx === -1 || prevValue === "") return 0;
    return currIdx > prevIdx ? 1 : -1;
  }, [value, prevValue, tabOrder]);

  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      <motion.div
        initial={{ x: direction * 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Content>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
