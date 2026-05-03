type IconProps = {
  className?: string;
};

const icon = (name: string, className?: string) => (
  <i className={`bi bi-${name} ${className || "fs-6"}`}></i>
);

export const PlusIcon = ({ className }: IconProps = {}) =>
  icon("plus", className);

export const SaveIcon = ({ className }: IconProps = {}) =>
  icon("save", className);

export const XIcon = ({ className }: IconProps = {}) =>
  icon("x", className);

export const TrashIcon = ({ className }: IconProps = {}) =>
  icon("trash", className);

export const EyeIcon = ({ className }: IconProps = {}) =>
  icon("eye", className);

export const EditIcon = ({ className }: IconProps = {}) =>
  icon("pencil", className);

export const CheckIcon = ({ className }: IconProps = {}) =>
  icon("check", className);

export const BanIcon = ({ className }: IconProps = {}) =>
  icon("slash-circle", className);

export const ChevronLeftIcon = ({ className }: IconProps = {}) =>
  icon("chevron-left", className);

export const ChevronRightIcon = ({ className }: IconProps = {}) =>
  icon("chevron-right", className);

export const LogoutIcon = ({ className }: IconProps = {}) =>
  icon("box-arrow-right", className);

export const UserIcon = ({ className }: IconProps = {}) =>
  icon("person", className);

export const DashboardIcon = ({ className }: IconProps = {}) =>
  icon("grid", className);

export const ExpensesIcon = ({ className }: IconProps = {}) =>
  icon("list", className);

export const CardIcon = ({ className }: IconProps = {}) =>
  icon("credit-card", className);

export const ShieldIcon = ({ className }: IconProps = {}) =>
  icon("shield", className);