export default function CartHeader() {
  return (
    <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b mb-4">
      <div className="col-span-6">
        <span className="text-sm font-normal text-muted-foreground">
          PRODUCT
        </span>
      </div>
      <div className="col-span-3 text-center">
        <span className="text-sm font-normal text-muted-foreground">
          QUANTITY
        </span>
      </div>
      <div className="col-span-3 text-right">
        <span className="text-sm font-normal text-muted-foreground">TOTAL</span>
      </div>
    </div>
  );
}
