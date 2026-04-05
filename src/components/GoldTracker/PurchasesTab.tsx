import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, Coins, Download, Upload } from "lucide-react";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { toBasePrice } from "@/utils/goldPricing";
import { GoldPurchase } from "@/types/gold";
import { PurchasesTabProps, SortField, SortDirection } from "./types";

const PurchasesTab = ({
  purchases,
  currentGoldPrice,
  lastMonthGoldPrice,
  isLoadingPrice,
  isLoadingHistoricalPrice,
  isLoadingData,
  averagePricePerGram,
  newPurchase,
  setNewPurchase,
  setCurrentGoldPrice,
  setLastMonthGoldPrice,
  fetchCurrentGoldPrice,
  fetchLastMonthGoldPrice,
  addPurchase,
  removePurchase,
  updatePurchase,
  importPurchases,
}: PurchasesTabProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingPurchase, setEditingPurchase] = useState<GoldPurchase | null>(null);
  const [editForm, setEditForm] = useState({ grams: '', amountPaid: '', date: '', pricePerGram: '', description: '' });
  const [descriptionDrafts, setDescriptionDrafts] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const currentBasePrice = toBasePrice(currentGoldPrice);
  const lastMonthBasePrice = toBasePrice(lastMonthGoldPrice);
  const editBasePrice = toBasePrice(parseFloat(editForm.pricePerGram) || 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPurchases = [...purchases].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'grams':
        aValue = a.grams;
        bValue = b.grams;
        break;
      case 'amountPaid':
        aValue = a.amountPaid;
        bValue = b.amountPaid;
        break;
      case 'pricePerGram':
        aValue = a.pricePerGram;
        bValue = b.pricePerGram;
        break;
      case 'currentValue':
        aValue = a.grams * currentGoldPrice;
        bValue = b.grams * currentGoldPrice;
        break;
      case 'return':
        aValue = (a.grams * currentGoldPrice) - a.amountPaid;
        bValue = (b.grams * currentGoldPrice) - b.amountPaid;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const openEditDialog = (purchase: GoldPurchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      grams: String(purchase.grams),
      amountPaid: String(purchase.amountPaid),
      date: purchase.date,
      pricePerGram: String(purchase.pricePerGram),
      description: purchase.description ?? '',
    });
  };

  const saveEdit = () => {
    if (!editingPurchase) return;
    const grams = parseFloat(editForm.grams);
    const amountPaid = parseFloat(editForm.amountPaid);
    const pricePerGram = parseFloat(editForm.pricePerGram);
    if (isNaN(grams) || isNaN(amountPaid) || isNaN(pricePerGram) || !editForm.date) return;
    updatePurchase(editingPurchase.id, { grams, amountPaid, date: editForm.date, pricePerGram, description: editForm.description.trim() });
    setEditingPurchase(null);
  };

  const saveDescription = (purchase: GoldPurchase) => {
    const draft = descriptionDrafts[purchase.id];
    if (draft === undefined) return;

    const nextDescription = draft.trim();
    if (nextDescription === (purchase.description ?? '')) {
      setDescriptionDrafts(prev => {
        const { [purchase.id]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    updatePurchase(purchase.id, { description: nextDescription });
    setDescriptionDrafts(prev => {
      const { [purchase.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const exportCsv = () => {
    const sanitizeCsvValue = (value: string | number) => String(value).replace(/[\r\n,]+/g, ' ').trim();
    const header = 'date,grams,amountPaid,pricePerGram,description';
    const rows = purchases.map(p =>
      [
        sanitizeCsvValue(p.date),
        sanitizeCsvValue(p.grams),
        sanitizeCsvValue(p.amountPaid),
        sanitizeCsvValue(p.pricePerGram),
        sanitizeCsvValue(p.description ?? ''),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold-purchases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setIsImporting(false); return; }

      const header = lines[0].split(',').map(h => h.trim());
      const dateIdx = header.indexOf('date');
      const gramsIdx = header.indexOf('grams');
      const amountPaidIdx = header.indexOf('amountPaid');
      const pricePerGramIdx = header.indexOf('pricePerGram');
      const descriptionIdx = header.indexOf('description');

      if (dateIdx === -1 || gramsIdx === -1 || amountPaidIdx === -1 || pricePerGramIdx === -1) {
        setIsImporting(false);
        return;
      }

      const parsed = lines.slice(1)
        .map(line => {
          const cols = line.split(',').map(c => c.trim());
          const grams = parseFloat(cols[gramsIdx]);
          const amountPaid = parseFloat(cols[amountPaidIdx]);
          const pricePerGram = parseFloat(cols[pricePerGramIdx]);
          const date = cols[dateIdx];
          const description = descriptionIdx >= 0 ? (cols[descriptionIdx] ?? '') : '';
          if (isNaN(grams) || isNaN(amountPaid) || isNaN(pricePerGram) || !date) return null;
          return { grams, amountPaid, date, pricePerGram, description };
        })
        .filter((p): p is Omit<GoldPurchase, 'id'> => p !== null);

      if (parsed.length > 0) {
        await importPurchases(parsed);
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent text-gold/70 hover:text-gold transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Gold Price Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold animate-gold-pulse" />
              Current Gold Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price per gram (incl. 5% tax)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentGoldPrice}
                    onChange={(e) => setCurrentGoldPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Enter current gold price per gram"
                    className="pl-7 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
                  />
                </div>
              </div>
              <Button
                onClick={fetchCurrentGoldPrice}
                disabled={isLoadingPrice}
                variant="outline"
                size="sm"
                className="border-gold/20 hover:bg-gold/10 hover:border-gold/30 text-gold/80 hover:text-gold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingPrice ? 'animate-spin' : ''}`} />
                {isLoadingPrice ? 'Fetching...' : 'Fetch'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2.5 space-y-1">
              <div className="flex items-center gap-1">
                Your average: <span className="text-gold/70 font-medium">{formatCurrency(averagePricePerGram)}/g</span>
              </div>
              <div>
                Base API price: <span className="text-gold/70 font-medium">{formatCurrency(currentBasePrice)}/g</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold/50" />
              30-Day Historical Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price per gram (incl. 5% tax)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={lastMonthGoldPrice}
                    onChange={(e) => setLastMonthGoldPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Enter gold price from 30 days ago"
                    className="pl-7 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
                  />
                </div>
              </div>
              <Button
                onClick={fetchLastMonthGoldPrice}
                disabled={isLoadingHistoricalPrice}
                variant="outline"
                size="sm"
                className="border-gold/20 hover:bg-gold/10 hover:border-gold/30 text-gold/80 hover:text-gold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingHistoricalPrice ? 'animate-spin' : ''}`} />
                {isLoadingHistoricalPrice ? 'Fetching...' : 'Fetch'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2.5 space-y-1">
              <div>Used for 30-day return calculations</div>
              <div>
                Base API price: <span className="text-gold/70 font-medium">{formatCurrency(lastMonthBasePrice)}/g</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Purchase */}
      <Card className="glass-card-gold gold-border-glow overflow-hidden relative glow-gold-sm">
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-playfair text-gold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Purchase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grams</label>
              <Input
                type="number"
                step="0.01"
                value={newPurchase.grams}
                onChange={(e) => setNewPurchase({...newPurchase, grams: e.target.value})}
                placeholder="0.00"
                className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
              <Input
                type="date"
                value={newPurchase.date}
                onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                value={newPurchase.description}
                onChange={(e) => setNewPurchase({...newPurchase, description: e.target.value})}
                placeholder="Optional note"
                className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={addPurchase}
                className="w-full bg-gradient-to-r from-gold-dark via-gold to-gold-dark hover:from-gold hover:via-gold-light hover:to-gold text-background font-semibold shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Purchase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card className="glass-card gold-border-glow overflow-hidden relative">
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-playfair text-gold/90">Purchase History</CardTitle>
            <div className="flex items-center gap-2">
              {purchases.length > 0 && (
                <span className="text-xs text-muted-foreground font-inter">
                  {purchases.length} record{purchases.length !== 1 ? 's' : ''}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={purchases.length === 0}
                className="border-gold/20 hover:bg-gold/10 hover:border-gold/30 text-gold/80 hover:text-gold h-7 text-xs gap-1.5"
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isImporting}
                className="border-gold/20 hover:bg-gold/10 hover:border-gold/30 text-gold/80 hover:text-gold h-7 text-xs gap-1.5 relative"
                onClick={() => document.getElementById('csv-import')?.click()}
              >
                <Upload className="w-3 h-3" />
                {isImporting ? 'Importing...' : 'Import'}
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  onChange={handleImportCsv}
                  className="hidden"
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin text-gold/50" />
                <span className="text-sm">Loading your portfolio...</span>
              </div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10">
                  <Coins className="w-8 h-8 text-gold/40" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No purchases recorded yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Add your first gold purchase above to get started</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="min-w-[700px] px-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/10 hover:bg-transparent">
                      <TableHead><SortButton field="date" label="Date" /></TableHead>
                      <TableHead><SortButton field="grams" label="Grams" /></TableHead>
                      <TableHead><SortButton field="amountPaid" label="Amount Paid" /></TableHead>
                      <TableHead><SortButton field="pricePerGram" label="Price/Gram" /></TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead><SortButton field="currentValue" label="Current Value" /></TableHead>
                      <TableHead><SortButton field="return" label="Return" /></TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPurchases.map((purchase) => {
                      const cv = purchase.grams * currentGoldPrice;
                      const returnAmount = cv - purchase.amountPaid;
                      const returnPercent = purchase.amountPaid > 0 ? (returnAmount / purchase.amountPaid) * 100 : 0;

                      return (
                        <TableRow
                          key={purchase.id}
                          className="border-gold/5 hover:bg-gold/[0.03] transition-colors duration-200 group/row"
                        >
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(purchase.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="font-medium text-gold/90">{formatWeight(purchase.grams)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(purchase.amountPaid)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="font-medium text-foreground">{formatCurrency(purchase.pricePerGram)}</div>
                            <div className="text-xs text-muted-foreground/80">
                              Base: {formatCurrency(toBasePrice(purchase.pricePerGram))}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-52">
                            <Input
                              value={descriptionDrafts[purchase.id] ?? purchase.description ?? ''}
                              onChange={(e) => setDescriptionDrafts(prev => ({ ...prev, [purchase.id]: e.target.value }))}
                              onBlur={() => saveDescription(purchase)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              placeholder="Optional description"
                              className="h-8 bg-background/50 border-gold/10 focus:border-gold/30 focus:ring-gold/20"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm">{formatCurrency(cv)}</TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1.5 text-sm font-medium ${returnAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {returnAmount >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {formatCurrency(returnAmount)}
                              <span className={`text-xs px-1.5 py-0.5 rounded-md ${returnAmount >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                                {formatPercentage(returnPercent)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(purchase)}
                                className="opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity text-gold/60 hover:text-gold hover:bg-gold/10 h-8 w-8 p-0"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePurchase(purchase.id)}
                                className="opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={(open) => !open && setEditingPurchase(null)}>
        <DialogContent className="glass-card border-gold/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-gold">Edit Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grams</label>
              <Input
                type="number"
                step="0.01"
                value={editForm.grams}
                onChange={(e) => setEditForm({ ...editForm, grams: e.target.value })}
                className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount Paid</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.amountPaid}
                  onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })}
                  className="pl-7 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price per Gram (incl. 5% tax)</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.pricePerGram}
                  onChange={(e) => setEditForm({ ...editForm, pricePerGram: e.target.value })}
                  className="pl-7 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20"
                />
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">
                Base price: <span className="text-gold/70 font-medium">{formatCurrency(editBasePrice)}/g</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Optional note"
                className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPurchase(null)}
              className="border-gold/20 hover:bg-gold/10 text-gold/80"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              className="bg-gradient-to-r from-gold-dark via-gold to-gold-dark hover:from-gold hover:via-gold-light hover:to-gold text-background font-semibold shadow-lg shadow-gold/20"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesTab;
