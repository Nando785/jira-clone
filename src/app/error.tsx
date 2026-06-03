"use client";

import { AlertTriangle } from "lucide-react"
import Link from "next/link";

import { Button } from "@/components/ui/button";

const ErrorPage = () => {
    return (
        <div className="flex flex-col h-screen gap-y-4 items-center justify-center">
            <AlertTriangle className="size-6 text-muted-foreground"/>
            <h1 className="text-sm text-muted-foreground">
                Something went wrong
            </h1>

            <Button variant="secondary" size="sm">
                <Link href="/">
                    Back to home
                </Link>
            </Button>
        </div>
    )
}

export default ErrorPage;