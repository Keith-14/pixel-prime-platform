import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, Info } from 'lucide-react';

export const Zakat = () => {
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [business, setBusiness] = useState('');
  const [investments, setInvestments] = useState('');
  const [zakatAmount, setZakatAmount] = useState(0);

  const calculateZakat = () => {
    const totalWealth = 
      parseFloat(cash || '0') + 
      parseFloat(gold || '0') + 
      parseFloat(silver || '0') + 
      parseFloat(business || '0') + 
      parseFloat(investments || '0');
    
    // Nisab threshold (approximate value in USD - should be updated regularly)
    const nisab = 4500; // This should be based on current gold/silver prices
    
    if (totalWealth >= nisab) {
      const zakat = totalWealth * 0.025; // 2.5%
      setZakatAmount(zakat);
    } else {
      setZakatAmount(0);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">Zakat Calculator</h1>
          <p className="text-sm text-muted-foreground">Calculate your obligatory charity</p>
        </div>

        {/* Info Card */}
        <Card className="bg-secondary/50 border-border p-4 rounded-2xl">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground mb-2">
                Zakat is 2.5% of your total wealth above the Nisab threshold.
              </p>
              <p className="text-muted-foreground text-xs">
                Current Nisab: $4,500 (based on gold price)
              </p>
            </div>
          </div>
        </Card>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="cash" className="text-primary font-medium">Cash & Savings ($)</Label>
            <Input
              id="cash"
              type="number"
              placeholder="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="mt-1 bg-card border-border"
            />
          </div>

          <div>
            <Label htmlFor="gold" className="text-primary font-medium">Gold Value ($)</Label>
            <Input
              id="gold"
              type="number"
              placeholder="0"
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              className="mt-1 bg-card border-border"
            />
          </div>

          <div>
            <Label htmlFor="silver" className="text-primary font-medium">Silver Value ($)</Label>
            <Input
              id="silver"
              type="number"
              placeholder="0"
              value={silver}
              onChange={(e) => setSilver(e.target.value)}
              className="mt-1 bg-card border-border"
            />
          </div>

          <div>
            <Label htmlFor="business" className="text-primary font-medium">Business Assets ($)</Label>
            <Input
              id="business"
              type="number"
              placeholder="0"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className="mt-1 bg-card border-border"
            />
          </div>

          <div>
            <Label htmlFor="investments" className="text-primary font-medium">Investments & Stocks ($)</Label>
            <Input
              id="investments"
              type="number"
              placeholder="0"
              value={investments}
              onChange={(e) => setInvestments(e.target.value)}
              className="mt-1 bg-card border-border"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={calculateZakat}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-2xl font-medium"
        >
          <Calculator className="h-5 w-5 mr-2" />
          Calculate Zakat
        </Button>

        {/* Result */}
        {zakatAmount > 0 && (
          <Card className="bg-primary text-primary-foreground p-6 rounded-2xl text-center">
            <h3 className="text-lg font-semibold mb-2">Your Zakat Amount</h3>
            <p className="text-3xl font-bold">${zakatAmount.toFixed(2)}</p>
            <p className="text-sm opacity-90 mt-2">
              This is your obligatory charity for this lunar year
            </p>
          </Card>
        )}

        {zakatAmount === 0 && cash && (
          <Card className="bg-card p-4 rounded-2xl text-center">
            <p className="text-muted-foreground">
              {parseFloat(cash || '0') + parseFloat(gold || '0') + parseFloat(silver || '0') + parseFloat(business || '0') + parseFloat(investments || '0') < 4500
                ? "Your wealth is below the Nisab threshold. No Zakat is due."
                : "Please enter your assets and calculate."}
            </p>
          </Card>
        )}

        {/* Islamic Guidelines */}
        <Card className="bg-card p-4 rounded-2xl">
          <h3 className="text-lg font-semibold text-primary mb-3">Zakat Guidelines</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Zakat is calculated on wealth held for one lunar year</p>
            <p>• Rate is 2.5% of total qualifying wealth</p>
            <p>• Must be above Nisab threshold to be obligatory</p>
            <p>• Should be given to the eight categories mentioned in Quran</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
