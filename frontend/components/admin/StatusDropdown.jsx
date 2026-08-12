'use client'

import { useState } from 'react'
import { updateDeliveryStatus } from '../../../backend/actions/admin'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export function StatusDropdown({ orderId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus || 'Processing')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (e) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    setIsUpdating(true)
    
    const result = await updateDeliveryStatus(orderId, newStatus)
    
    setIsUpdating(false)
    if (result?.error) {
      toast.error(result.error)
      setStatus(initialStatus) // Revert on failure
    } else {
      toast.success(`Order ${orderId.slice(0, 8)} status updated to ${newStatus}`)
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={status}
        onChange={handleChange}
        disabled={isUpdating}
        className="appearance-none bg-[#f8f8f8] border border-neutral-300 text-[#1a1a1a] font-['DM_Sans'] text-sm px-3 py-1.5 pr-8 focus:outline-none focus:border-[#1a1a1a] disabled:opacity-50 cursor-pointer transition-colors"
      >
        <option value="Processing">Processing</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
      {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-neutral-500 ml-2" />}
    </div>
  )
}
