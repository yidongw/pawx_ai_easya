export const BaseTemplate = (props: {
  children: React.ReactNode;
}) => {
  return (
    <div className="w-full p-1 antialiased">
      <div className="mx-auto min-w-[320px] max-w-screen-lg">
        <main>{props.children}</main>
      </div>
    </div>
  );
};
