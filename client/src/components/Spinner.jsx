const Spinner = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 z-10 flex justify-center items-center opacity-70">
      <div className="w-20 h-20 z-50 border-2 border-dashed border-red-300 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
