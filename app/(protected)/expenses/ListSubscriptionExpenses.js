import ListModal from "@/components/ListModal";

export default function ListSubscriptionExpenses({ expenses = [], showModal, setShowModal }) {
  return (
    <ListModal isOpen={showModal} onClose={() => setShowModal(false)} title="Subscription Expense Items">
      <div className="table-shell">
        <table className="table table-hover table-sm mb-0 list-table-wide">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Subscription Type</th>
              <th>Started On</th>
              <th>Ends On</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Created Date</th>
              <th>Updated Date</th>
            </tr>
          </thead>

          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-4 text-center text-muted">
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.subscription_type}</td>
                  <td>{item.started_on}</td>
                  <td>{item.ends_on}</td>
                  <td>
                    {item.subscription_type == "others" ? item.subscription_type_other_name : item.name}
                  </td>
                  <td>INR {item.amount}</td>
                  <td>{item.description}</td>
                  <td>{item.created_at}</td>
                  <td>{item.updated_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ListModal>
  );
}

