import { CarIcon, DownloadIcon, UploadIcon, Clock9Icon } from 'lucide-react'

import { Card } from '@/components/ui/card'

import VehicleOverviewCard from '@/views/dashboards/charts/chart-vehicle-overview'
import UserOrderCard from '@/views/dashboards/widgets/widget-user-order'
import SalesPerformanceCard from '@/views/dashboards/charts/chart-sales-performance'
import CustomerRatingsCard from '@/views/dashboards/charts/chart-customer-ratings'
import VehiclesConditionCard from '@/views/dashboards/widgets/widget-vehicles-condition'
import VehicleRouteDatatable, { type Item } from '@/views/datatables/datatable-vehicle-route'

const vehicleOverviewData = [
  {
    status: 'On the way',
    percentage: 33.3,
    time: '2hr 10min',
    icon: <CarIcon />,
    width: 'w-[33.3%]',
    colors: 'bg-primary/10 text-primary'
  },
  {
    status: 'Unloading',
    percentage: 23.5,
    time: '3hr 15min',
    icon: <DownloadIcon />,
    width: 'w-[23.5%]',
    colors: 'bg-chart-1 text-primary-foreground'
  },
  {
    status: 'Loading',
    percentage: 22.1,
    time: '1hr 24min',
    icon: <UploadIcon />,
    width: 'w-[22.1%]',
    colors: 'bg-chart-2 text-primary-foreground'
  },
  {
    status: 'Waiting',
    percentage: 21.1,
    time: '5hr 19min',
    icon: <Clock9Icon />,
    width: 'w-[21.1%]',
    colors: 'bg-chart-3 text-primary-foreground'
  }
]

// Sales data
const salesData = [
  {
    title: 'Online Store',
    value: 88,
    color: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    title: 'Offline Store',
    value: 64,
    color: '**:data-[slot=progress-indicator]:bg-chart-2'
  }
]

// Vehicle condition data
const vehicleConditionData = [
  {
    condition: 'Excellent',
    details: '12% increase',
    progressValue: 55,
    changePercentage: '+25%',
    progressClassName: 'stroke-chart-1'
  },
  {
    condition: 'Good',
    details: '24 vehicles',
    progressValue: 20,
    changePercentage: '+30%',
    progressClassName: 'stroke-chart-2'
  },
  {
    condition: 'Average',
    details: '182 Tasks',
    progressValue: 12,
    changePercentage: '-15%',
    progressClassName: 'stroke-chart-3'
  },
  {
    condition: 'Bad',
    details: '9 vehicles',
    progressValue: 8,
    changePercentage: '+35%',
    progressClassName: 'stroke-chart-5'
  },
  {
    condition: 'Not Working',
    details: '3 vehicles',
    progressValue: 5,
    changePercentage: '-2%'
  }
]

// Vehicle route data
const vehicleData: Item[] = [
  {
    id: '1',
    vehicle: 159145,
    startingRoute: 'Paris 19, France',
    endingRoute: 'Dresdon, Germany',
    warning: 'No warning',
    progress: 50,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '2',
    vehicle: 163825,
    startingRoute: 'Tokyo 23, Japan',
    endingRoute: 'Budapest, Hungary',
    warning: 'Fuel problems',
    progress: 75,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-2'
  },
  {
    id: '3',
    vehicle: 182624,
    startingRoute: 'New York City, USA',
    endingRoute: 'Kyoto, Japan',
    warning: 'Temperature not optimal',
    progress: 25,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-2'
  },
  {
    id: '4',
    vehicle: 27568,
    startingRoute: 'Berlin, Germany',
    endingRoute: 'Cape Town, South Africa',
    warning: 'Ecu not responding',
    progress: 50,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '5',
    vehicle: 300168,
    startingRoute: 'Sydney, Australia',
    endingRoute: 'Buenos Aires, Argentina',
    warning: 'Oil leakage',
    progress: 25,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-5'
  },
  {
    id: '6',
    vehicle: 321659,
    startingRoute: 'Rio de Janeiro, Brazil',
    endingRoute: 'Toronto, Canada',
    warning: 'Fuel problems',
    progress: 75,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-3'
  },
  {
    id: '7',
    vehicle: 445782,
    startingRoute: 'London, UK',
    endingRoute: 'Mumbai, India',
    warning: 'No warning',
    progress: 90,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '8',
    vehicle: 589634,
    startingRoute: 'Los Angeles, USA',
    endingRoute: 'Moscow, Russia',
    warning: 'Temperature not optimal',
    progress: 40,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-4'
  },
  {
    id: '9',
    vehicle: 672154,
    startingRoute: 'Dubai, UAE',
    endingRoute: 'Singapore',
    warning: 'Oil leakage',
    progress: 60,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-5'
  },
  {
    id: '10',
    vehicle: 758932,
    startingRoute: 'Madrid, Spain',
    endingRoute: 'Bangkok, Thailand',
    warning: 'Fuel problems',
    progress: 85,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-3'
  },
  {
    id: '11',
    vehicle: 823456,
    startingRoute: 'Rome, Italy',
    endingRoute: 'Cairo, Egypt',
    warning: 'No warning',
    progress: 30,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '12',
    vehicle: 934567,
    startingRoute: 'Amsterdam, Netherlands',
    endingRoute: 'Seoul, South Korea',
    warning: 'Ecu not responding',
    progress: 55,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-2'
  },
  {
    id: '13',
    vehicle: 105672,
    startingRoute: 'Stockholm, Sweden',
    endingRoute: 'Jakarta, Indonesia',
    warning: 'Temperature not optimal',
    progress: 70,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-3'
  },
  {
    id: '14',
    vehicle: 218934,
    startingRoute: 'Vienna, Austria',
    endingRoute: 'Manila, Philippines',
    warning: 'Oil leakage',
    progress: 45,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-4'
  },
  {
    id: '15',
    vehicle: 345789,
    startingRoute: 'Brussels, Belgium',
    endingRoute: 'Lagos, Nigeria',
    warning: 'Fuel problems',
    progress: 65,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-5'
  },
  {
    id: '16',
    vehicle: 467123,
    startingRoute: 'Zurich, Switzerland',
    endingRoute: 'Nairobi, Kenya',
    warning: 'No warning',
    progress: 80,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '17',
    vehicle: 578245,
    startingRoute: 'Copenhagen, Denmark',
    endingRoute: 'Casablanca, Morocco',
    warning: 'Temperature not optimal',
    progress: 35,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '18',
    vehicle: 689456,
    startingRoute: 'Helsinki, Finland',
    endingRoute: 'Addis Ababa, Ethiopia',
    warning: 'Ecu not responding',
    progress: 95,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-2'
  },
  {
    id: '19',
    vehicle: 790567,
    startingRoute: 'Oslo, Norway',
    endingRoute: 'Algiers, Algeria',
    warning: 'Oil leakage',
    progress: 20,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-3'
  },
  {
    id: '20',
    vehicle: 812345,
    startingRoute: 'Warsaw, Poland',
    endingRoute: 'Tunis, Tunisia',
    warning: 'Fuel problems',
    progress: 88,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-5'
  },
  {
    id: '21',
    vehicle: 923456,
    startingRoute: 'Prague, Czech Republic',
    endingRoute: 'Rabat, Morocco',
    warning: 'No warning',
    progress: 42
  },
  {
    id: '22',
    vehicle: 134567,
    startingRoute: 'Budapest, Hungary',
    endingRoute: 'Dakar, Senegal',
    warning: 'Temperature not optimal',
    progress: 67,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-1'
  },
  {
    id: '23',
    vehicle: 245678,
    startingRoute: 'Bucharest, Romania',
    endingRoute: 'Accra, Ghana',
    warning: 'Oil leakage',
    progress: 52,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-2'
  },
  {
    id: '24',
    vehicle: 356789,
    startingRoute: 'Sofia, Bulgaria',
    endingRoute: 'Abidjan, Ivory Coast',
    warning: 'Ecu not responding',
    progress: 78,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-3'
  },
  {
    id: '25',
    vehicle: 467890,
    startingRoute: 'Athens, Greece',
    endingRoute: 'Bamako, Mali',
    warning: 'Fuel problems',
    progress: 33,
    progressColor: '**:data-[slot=progress-indicator]:bg-chart-5'
  }
]

const LogisticsDashboard = () => {
  return (
    <div className='grid grid-cols-6 gap-6'>
      {/* Vehicle Overview Card */}
      <VehicleOverviewCard
        title='Vehicle overview'
        vehicleData={vehicleOverviewData}
        className='col-span-full xl:col-span-3'
      />

      {/* User Order Card */}
      <UserOrderCard className='col-span-full md:col-span-3' />

      {/* Sales Performance Card */}
      <SalesPerformanceCard
        title='Sales performance'
        value='68K'
        changePercentage={-6}
        salesData={salesData}
        className='col-span-full md:col-span-3 xl:col-span-2'
      />

      {/* Vehicles Condition Card */}
      <VehiclesConditionCard
        title='Vehicles Condition'
        vehicleConditionData={vehicleConditionData}
        className='col-span-full md:col-span-3 xl:col-span-2'
      />

      {/* Customer Ratings Card */}
      <CustomerRatingsCard className='col-span-full md:col-span-3 xl:col-span-2' />

      {/* Vehicle Route Datatable */}
      <Card className='col-span-full py-0'>
        <VehicleRouteDatatable data={vehicleData} />
      </Card>
    </div>
  )
}

export default LogisticsDashboard
