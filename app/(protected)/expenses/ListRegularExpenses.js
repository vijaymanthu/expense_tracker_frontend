import ListModal from "@/components/ListModal";

export default function ListRegularExpenses({ expenses = [], showModal, setShowModal }) {
  return (
    <ListModal isOpen={showModal} onClose={() => setShowModal(false)} title="Regular Expense Items">
      <div className="table-shell">
        <table className="table table-hover table-sm mb-0 list-table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Expense Type</th>
              <th>Amount</th>
              <th>Created Date</th>
              <th>Updated Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    {item.regular_expense_type == "Miscellaneous"
                      ? item.regular_expense_type_other_name
                      : item.regular_expense_type}
                  </td>
                  <td>
                    INR {item.amount}
                  </td>
                  <td>{item.created_at}</td>
                  <td>{item.updated_at}</td>
                  <td className="text-center">-</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ListModal>
  );
}

