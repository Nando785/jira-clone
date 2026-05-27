import { redirect } from "next/navigation";

import { SignUpCard } from "@/features/auth/components/sign-up-card";
import { getCurrent } from "@/features/auth/actions";

const SignUpPage = async () => {
	const user = await getCurrent();

	if (user) { redirect("/"); }

	return (
		<div>
			<SignUpCard />
		</div>
	);
};

export default SignUpPage