import RelatedToolsWidget, { RelatedToolsWidgetProps } from "./RelatedToolsWidget";

export type RelatedToolsProps = RelatedToolsWidgetProps;

export const RelatedTools = (props: RelatedToolsProps) => {
  return <RelatedToolsWidget {...props} />;
};

export default RelatedTools;
