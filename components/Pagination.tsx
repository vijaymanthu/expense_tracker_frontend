// components/Pagination.tsx
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  pageSize = 10
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="card mt-3 p-2">
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-outline-secondary btn-sm"
        aria-label="Previous page"
        title="Previous page"
      >
        <ChevronLeftIcon />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-outline-secondary"}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-outline-secondary btn-sm"
        aria-label="Next page"
        title="Next page"
      >
        <ChevronRightIcon />
      </button>
      </div>
    </div>
  );
}
