"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { upsertProperty, upsertMortgage } from "@/app/actions/accounts";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import type { Property, Mortgage } from "@/types";

interface PropertyMortgageDetailsProps {
  property: Property | null;
  mortgage: Mortgage | null;
  propertyAccountId: string | null;
  mortgageAccountId: string | null;
}

function DetailRow({
  label,
  value,
  editValue,
  isEditing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isEditing ? (
        <Input
          type={type}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-40 text-right text-sm"
        />
      ) : (
        <span className="text-sm font-medium tabular-nums">{value}</span>
      )}
    </div>
  );
}

export function PropertyMortgageDetails({
  property,
  mortgage,
  propertyAccountId,
  mortgageAccountId,
}: PropertyMortgageDetailsProps) {
  const [editingProperty, setEditingProperty] = useState(false);
  const [editingMortgage, setEditingMortgage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Property form state
  const [propPurchaseDate, setPropPurchaseDate] = useState(property?.purchase_date || "");
  const [propPurchasePrice, setPropPurchasePrice] = useState(
    property?.purchase_price_pence ? (property.purchase_price_pence / 100).toString() : ""
  );
  const [propValuation, setPropValuation] = useState(
    property?.current_valuation_pence ? (property.current_valuation_pence / 100).toString() : ""
  );
  const [propAddress, setPropAddress] = useState(property?.address || "");

  // Mortgage form state
  const [mortOriginal, setMortOriginal] = useState(
    mortgage?.original_amount_pence ? (mortgage.original_amount_pence / 100).toString() : ""
  );
  const [mortRate, setMortRate] = useState(mortgage?.interest_rate?.toString() || "");
  const [mortTerm, setMortTerm] = useState(mortgage?.term_months?.toString() || "");
  const [mortStart, setMortStart] = useState(mortgage?.start_date || "");
  const [mortFixedUntil, setMortFixedUntil] = useState(mortgage?.fixed_until || "");
  const [mortPayment, setMortPayment] = useState(
    mortgage?.monthly_payment_pence ? (mortgage.monthly_payment_pence / 100).toString() : ""
  );

  const handleSaveProperty = async () => {
    if (!propertyAccountId) return;
    setIsSaving(true);
    const result = await upsertProperty(property?.id || null, {
      account_id: propertyAccountId,
      purchase_date: propPurchaseDate || null,
      purchase_price_pence: propPurchasePrice ? Math.round(parseFloat(propPurchasePrice) * 100) : null,
      current_valuation_pence: propValuation ? Math.round(parseFloat(propValuation) * 100) : null,
      address: propAddress || null,
    });
    setIsSaving(false);
    if (result.success) {
      toast.success("Property updated");
      setEditingProperty(false);
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  const handleSaveMortgage = async () => {
    if (!mortgageAccountId || !property?.id) return;
    setIsSaving(true);
    const result = await upsertMortgage(mortgage?.id || null, {
      account_id: mortgageAccountId,
      property_id: property.id,
      original_amount_pence: Math.round(parseFloat(mortOriginal || "0") * 100),
      interest_rate: mortRate ? parseFloat(mortRate) : null,
      term_months: mortTerm ? parseInt(mortTerm) : null,
      start_date: mortStart || null,
      fixed_until: mortFixedUntil || null,
      monthly_payment_pence: mortPayment ? Math.round(parseFloat(mortPayment) * 100) : null,
    });
    setIsSaving(false);
    if (result.success) {
      toast.success("Mortgage updated");
      setEditingMortgage(false);
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  const formatDate = (d: string | null) =>
    d ? format(parseISO(d), "dd MMM yyyy") : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Property Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Property Details</CardTitle>
          {editingProperty ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSaveProperty}
                disabled={isSaving}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditingProperty(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditingProperty(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            <DetailRow
              label="Purchase Date"
              value={formatDate(property?.purchase_date || null)}
              editValue={propPurchaseDate}
              isEditing={editingProperty}
              onChange={setPropPurchaseDate}
              type="date"
            />
            <DetailRow
              label="Purchase Price"
              value={property?.purchase_price_pence ? formatGBP(property.purchase_price_pence) : "—"}
              editValue={propPurchasePrice}
              isEditing={editingProperty}
              onChange={setPropPurchasePrice}
              type="number"
            />
            <DetailRow
              label="Current Valuation"
              value={property?.current_valuation_pence ? formatGBP(property.current_valuation_pence) : "—"}
              editValue={propValuation}
              isEditing={editingProperty}
              onChange={setPropValuation}
              type="number"
            />
            <DetailRow
              label="Address"
              value={property?.address || "—"}
              editValue={propAddress}
              isEditing={editingProperty}
              onChange={setPropAddress}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mortgage Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Mortgage Details</CardTitle>
          {editingMortgage ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSaveMortgage}
                disabled={isSaving}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditingMortgage(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditingMortgage(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            <DetailRow
              label="Original Amount"
              value={mortgage?.original_amount_pence ? formatGBP(mortgage.original_amount_pence) : "—"}
              editValue={mortOriginal}
              isEditing={editingMortgage}
              onChange={setMortOriginal}
              type="number"
            />
            <DetailRow
              label="Interest Rate"
              value={mortgage?.interest_rate ? `${mortgage.interest_rate}%` : "—"}
              editValue={mortRate}
              isEditing={editingMortgage}
              onChange={setMortRate}
              type="number"
            />
            <DetailRow
              label="Term"
              value={mortgage?.term_months ? `${mortgage.term_months} months (${(mortgage.term_months / 12).toFixed(0)} years)` : "—"}
              editValue={mortTerm}
              isEditing={editingMortgage}
              onChange={setMortTerm}
              type="number"
            />
            <DetailRow
              label="Start Date"
              value={formatDate(mortgage?.start_date || null)}
              editValue={mortStart}
              isEditing={editingMortgage}
              onChange={setMortStart}
              type="date"
            />
            <DetailRow
              label="Fixed Until"
              value={formatDate(mortgage?.fixed_until || null)}
              editValue={mortFixedUntil}
              isEditing={editingMortgage}
              onChange={setMortFixedUntil}
              type="date"
            />
            <DetailRow
              label="Monthly Payment"
              value={mortgage?.monthly_payment_pence ? formatGBP(mortgage.monthly_payment_pence) : "—"}
              editValue={mortPayment}
              isEditing={editingMortgage}
              onChange={setMortPayment}
              type="number"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
