// Component Imports
import DataTableBasic from '@/views/datatables/basic'
import DataTableProgress from '@/views/datatables/progress'
import DataTableFilters from '@/views/datatables/filters'
import DataTablePageSizeSelector from '@/views/datatables/page-size-selectior'
import DataTableExportButtons from '@/views/datatables/export-button'
import DataTableGraph from '@/views/datatables/graph'
import DataTableColumnVisibility from '@/views/datatables/column-visibility'
import DataTableDraggableColumns from '@/views/datatables/draggable-columns'
import DataTableExpandableRows from '@/views/datatables/expandable-rows'
import DataTablePinnableColumns from '@/views/datatables/pinnable-columns'
import DataTableResizableColumns from '@/views/datatables/resizable-columns'

const DataTable = () => {
  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Basic Data Table</h2>
        <DataTableBasic />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data Table with Column Visibility</h2>
        <DataTableColumnVisibility />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Filters</h2>
        <DataTableFilters />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Resizable Columns</h2>
        <DataTableResizableColumns />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Pinnable Columns</h2>
        <DataTablePinnableColumns />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data Table with Page Size Selector</h2>
        <DataTablePageSizeSelector />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Draggable Columns</h2>
        <DataTableDraggableColumns />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Expandable Rows</h2>
        <DataTableExpandableRows />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Progress</h2>
        <DataTableProgress />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Export Buttons</h2>
        <DataTableExportButtons />
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Data table with Graph</h2>
        <DataTableGraph />
      </div>
    </div>
  )
}

export default DataTable
