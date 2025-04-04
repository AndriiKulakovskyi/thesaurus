import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  institution: z
    .string()
    .min(2, { message: "Institution must be at least 2 characters." }),
  position: z
    .string()
    .min(2, { message: "Position must be at least 2 characters." }),
  researchPurpose: z
    .string()
    .min(20, {
      message:
        "Please provide a more detailed research purpose (at least 20 characters).",
    }),
  dataUsage: z
    .string()
    .min(20, {
      message:
        "Please provide more details about how you plan to use the data (at least 20 characters).",
    }),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AccessRequestFormProps {
  projectId: string;
  projectTitle: string;
}

const AccessRequestForm = ({
  projectId,
  projectTitle,
}: AccessRequestFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      institution: "",
      position: "",
      researchPurpose: "",
      dataUsage: "",
      termsAgreed: false,
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    // Simulate API call
    try {
      // In a real application, you would send this data to your backend
      console.log("Access request data:", { projectId, ...data });

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSubmitted(true);
      toast({
        title: "Access request submitted",
        description:
          "Your request has been submitted and will be reviewed by the project administrators.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description:
          "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold text-green-600 mb-4">
          Request Submitted Successfully
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-2">
          Thank you for your interest in the {projectTitle} project.
        </p>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Your access request has been submitted and will be reviewed by the
          project administrators. You will receive an email notification once
          your request has been processed.
        </p>
        <p className="text-sm text-gray-500">
          Reference ID: {projectId.slice(0, 8)}-
          {Date.now().toString().slice(-6)}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">
        Request Access to {projectTitle}
      </h3>
      <p className="text-gray-600 mb-6">
        Please complete this form to request access to the datasets in this
        project. Your request will be reviewed by the project administrators.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution/Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="University of Example" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position/Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Research Scientist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="researchPurpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Research Purpose</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please describe your research and why you need access to this data..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain the specific aims of your research and how this data
                  will contribute.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataUsage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Data Usage</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe how you plan to use the data..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Detail the analyses you plan to perform and any publications
                  you anticipate.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAgreed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the terms and conditions for data access
                  </FormLabel>
                  <FormDescription>
                    By checking this box, you agree to use the data only for the
                    stated research purpose, not to attempt to identify
                    individual participants, and to acknowledge the data source
                    in any publications.
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Access Request"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AccessRequestForm;
