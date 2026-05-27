"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, RefreshCw, AlertCircle } from "lucide-react"
import { formatCurrency, calculatePerSecondIncome } from "@/lib/income-utils"
import { fetchBitcoinPrice } from "@/lib/crypto-api"

// Define types
type TimePeriod = "seconds" | "daily" | "weekly" | "monthly" | "yearly"
type Currency = "usd" | "btc"

interface IncomeStream {
  id: string
  name: string
  amount: number
  timePeriod: TimePeriod
  currency: Currency
  createdAt: string
}

// Default Bitcoin price as fallback
const DEFAULT_BITCOIN_PRICE = 65000

export default function PassiveIncomeTracker() {
  // State declarations remain the same...
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([])
  const [displayBtcAsSats, setDisplayBtcAsSats] = useState(false)
  const [currentEarnings, setCurrentEarnings] = useState(0)
  const [bitcoinPrice, setBitcoinPrice] = useState(DEFAULT_BITCOIN_PRICE)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>("")
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [apiError, setApiError] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly")
  const [currency, setCurrency] = useState<Currency>("usd")
  const [useSatsForInput, setUseSatsForInput] = useState(false)

  // Animation frame ref for the ticker
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const perSecondRateRef = useRef<number>(0)
  const isInitialLoadRef = useRef(true)

  // All useEffect hooks remain the same...
  // Load data from localStorage
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    // Load income streams
    const savedStreams = localStorage.getItem("incomeStreams")
    if (savedStreams) {
      try {
        const parsedStreams = JSON.parse(savedStreams)
        setIncomeStreams(parsedStreams)
      } catch (e) {
        console.error("Failed to parse saved income streams", e)
      }
    }

    // Load display preference
    const savedDisplayPreference = localStorage.getItem("displayBtcAsSats")
    if (savedDisplayPreference) {
      setDisplayBtcAsSats(savedDisplayPreference === "true")
    }

    // Load last known Bitcoin price
    const savedPrice = localStorage.getItem("bitcoinPrice")
    if (savedPrice) {
      try {
        setBitcoinPrice(Number(savedPrice))
      } catch (e) {
        console.error("Failed to parse saved Bitcoin price", e)
      }
    }

    // Get fresh Bitcoin price
    updateBitcoinPrice()

    // Set up interval to refresh Bitcoin price every 5 minutes
    const priceInterval = setInterval(
      () => {
        updateBitcoinPrice()
      },
      5 * 60 * 1000,
    ) // 5 minutes

    isInitialLoadRef.current = true

    return () => {
      clearInterval(priceInterval)
    }
  }, [])

  // Update per-second rate when streams or Bitcoin price changes
  useEffect(() => {
    if (isInitialLoadRef.current) return
    perSecondRateRef.current = calculatePerSecondIncome(bitcoinPrice)
  }, [incomeStreams, bitcoinPrice])

  // Save income streams to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || isInitialLoadRef.current) return
    localStorage.setItem("incomeStreams", JSON.stringify(incomeStreams))
  }, [incomeStreams])

  // Save display preference to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || isInitialLoadRef.current) return
    localStorage.setItem("displayBtcAsSats", displayBtcAsSats.toString())
  }, [displayBtcAsSats])

  // Save Bitcoin price to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || isInitialLoadRef.current) return
    localStorage.setItem("bitcoinPrice", bitcoinPrice.toString())
  }, [bitcoinPrice])

  // Set up the animation frame for real-time earnings
  useEffect(() => {
    if (typeof window === "undefined") return

    // Start the animation frame only once
    const updateEarnings = (timestamp: number) => {
      const now = Date.now()
      const elapsed = (now - lastUpdateTimeRef.current) / 1000
      lastUpdateTimeRef.current = now

      setCurrentEarnings((prev) => prev + perSecondRateRef.current * elapsed)
      animationFrameRef.current = requestAnimationFrame(updateEarnings)
    }

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(updateEarnings)

    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  // Fetch current Bitcoin price
  const updateBitcoinPrice = async () => {
    setIsLoadingPrice(true)
    setApiError(false)
    try {
      const price = await fetchBitcoinPrice()
      if (price) {
        setBitcoinPrice(price)
        setLastPriceUpdate(new Date().toLocaleTimeString())
      } else {
        setApiError(true)
      }
    } catch (error) {
      console.error("Failed to fetch Bitcoin price:", error)
      setApiError(true)
    } finally {
      setIsLoadingPrice(false)
    }
  }

  // Add income stream
  const addIncomeStream = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !amount) return

    let finalAmount = Number.parseFloat(amount)

    // If user entered sats, convert to BTC for storage
    if (currency === "btc" && useSatsForInput) {
      finalAmount = finalAmount / 100000000
    }

    const newStream: IncomeStream = {
      id: Date.now().toString(),
      name,
      amount: finalAmount,
      timePeriod,
      currency,
      createdAt: new Date().toISOString(),
    }

    setIncomeStreams((prev) => [...prev, newStream])

    // Reset form
    setName("")
    setAmount("")
    setTimePeriod("monthly")
    setCurrency("usd")
  }

  // Delete income stream
  const deleteIncomeStream = (id: string) => {
    setIncomeStreams((prev) => prev.filter((stream) => stream.id !== id))
  }

  // Calculate total earnings
  const totalUSD = incomeStreams.reduce((total, stream) => {
    let streamAmount = stream.amount
    if (stream.currency === "btc") {
      streamAmount *= bitcoinPrice
    }

    // Convert to yearly amount for standard calculation
    switch (stream.timePeriod) {
      case "seconds":
        return total + streamAmount * 31536000 // seconds in a year
      case "daily":
        return total + streamAmount * 365
      case "weekly":
        return total + streamAmount * 52
      case "monthly":
        return total + streamAmount * 12
      case "yearly":
        return total + streamAmount
    }
  }, 0)

  const totalBTC = totalUSD / bitcoinPrice

  return (
    <div className="w-full max-w-3xl">
      {/* Real-time income counter */}
      <Card className="mb-8 overflow-hidden backdrop-blur-md bg-opacity-20 bg-white border-0 ring-1 ring-white/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2 text-white">Real-time Earnings</h2>
            <div className="text-4xl font-bold tracking-tight text-white">
              ${Math.max(0, currentEarnings).toFixed(6)}
            </div>
            <p className="text-white/70 mt-2">
              Your passive income is accumulating in real-time
              {perSecondRateRef.current > 0 && (
                <span className="block mt-1 text-green-300">(${perSecondRateRef.current.toFixed(6)} per second)</span>
              )}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-white">Total Tracked</h3>
                <p className="text-2xl font-semibold text-white">
                  ${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="block text-sm text-white/70">per year</span>
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-lg font-medium text-white">Bitcoin</h3>
                  <Switch
                    id="sats-display-toggle"
                    checked={displayBtcAsSats}
                    onCheckedChange={setDisplayBtcAsSats}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <span className="text-xs text-white/70">{displayBtcAsSats ? "sats" : "BTC"}</span>
                </div>
                <p className="text-2xl font-semibold text-white">
                  {displayBtcAsSats
                    ? `${(totalBTC * 100000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} sats`
                    : `${totalBTC.toFixed(8)} BTC`}
                  <span className="block text-sm text-white/70">per year</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income streams form */}
      <Card className="mb-6 backdrop-blur-md bg-opacity-20 bg-white border-0 ring-1 ring-white/20">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-4 text-white">Add Income Stream</h2>

          <form onSubmit={addIncomeStream} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Source Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Rental, Dividends, YouTube"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">
                  Currency
                </Label>
                <RadioGroup
                  id="currency"
                  value={currency}
                  onValueChange={(value) => setCurrency(value as Currency)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="usd" id="usd" />
                    <Label htmlFor="usd" className="text-white">
                      USD
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="btc" id="btc" />
                    <Label htmlFor="btc" className="text-white">
                      BTC
                    </Label>
                  </div>
                </RadioGroup>

                {currency === "btc" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="sats-input-toggle"
                      checked={useSatsForInput}
                      onCheckedChange={setUseSatsForInput}
                      className="data-[state=checked]:bg-amber-500"
                    />
                    <Label htmlFor="sats-input-toggle" className="text-white/70 text-sm">
                      Enter amount in satoshis (sats)
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2 relative z-10">
                <Label htmlFor="timePeriod" className="text-white">
                  Time Period
                </Label>
                <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                  <SelectTrigger id="timePeriod" className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-neutral-800 border-white/20 text-white">
                    <SelectItem value="seconds" className="focus:bg-white/10 focus:text-white">
                      Per Second
                    </SelectItem>
                    <SelectItem value="daily" className="focus:bg-white/10 focus:text-white">
                      Daily
                    </SelectItem>
                    <SelectItem value="weekly" className="focus:bg-white/10 focus:text-white">
                      Weekly
                    </SelectItem>
                    <SelectItem value="monthly" className="focus:bg-white/10 focus:text-white">
                      Monthly
                    </SelectItem>
                    <SelectItem value="yearly" className="focus:bg-white/10 focus:text-white">
                      Yearly
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" /> Add Income Stream
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Income streams list */}
      <Card className="backdrop-blur-md bg-opacity-20 bg-white border-0 ring-1 ring-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-white">Your Income Streams</h2>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={updateBitcoinPrice}
                disabled={isLoadingPrice}
                className="text-white/70 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingPrice ? "animate-spin" : ""}`} />
                Update BTC Price
              </Button>
            </div>
          </div>

          {incomeStreams.length === 0 ? (
            <div className="text-center py-10 text-white/70">
              <p>No income streams added yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomeStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-3 rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                  <div>
                    <h3 className="font-medium text-white">{stream.name}</h3>
                    <p className="text-sm text-white/70">
                      {formatCurrency(stream.amount, stream.currency, displayBtcAsSats)} per {stream.timePeriod}
                      {stream.currency === "btc" && (
                        <span className="ml-2 text-green-300">≈ ${(stream.amount * bitcoinPrice).toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteIncomeStream(stream.id)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-white/60">
            <div className="flex items-center justify-center gap-1">
              <p>
                Bitcoin Price: ${bitcoinPrice.toLocaleString()} | 1 BTC = 100,000,000 sats
                {lastPriceUpdate && <span className="ml-2">(Last updated: {lastPriceUpdate})</span>}
              </p>
              {apiError && (
                <span className="flex items-center text-amber-400 ml-2">
                  <AlertCircle className="h-3 w-3 mr-1" /> Using fallback price
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
